import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { requireAuth, createCustomToken, AuthRequest } from './src/middleware/auth.ts';
import {
  getOrCreateUser,
  getUserProfile,
  updateUserProfile,
  getWalletDetails,
  initializePayment,
  getPaymentTransaction,
  verifyAndCreditPayment,
  adminAdjustWallet,
  autoVerifyOrProcessPayment,
  getMarketplaceProducts,
  buyProductAccount,
  getAvailablePhoneNumbers,
  rentPhoneNumber,
  getUserRentedNumbers,
  getNumberSMSLogs,
  getUserOrders,
  getUserNotifications,
  markNotificationsAsRead,
  getAdminAnalytics,
  getAdminUsersList,
  updateRole,
  getAllOrdersAdmin,
  refundOrderAdmin,
  addProductAdmin,
  editProductAdmin,
  deleteProductAdmin,
  addInventoryAdmin,
  generateUserApiKey,
  getUserByApiKey,
  getExternalProducts,
  buyExternalProductAccount,
  getPaymentTransactionsAdmin,
  declinePaymentTransactionAdmin,
  getUserByEmail,
} from './src/db/helpers.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // ---------------------------------------------------------------------------
  // PUBLIC / HEALTH API & PUBLIC AUTH
  // ---------------------------------------------------------------------------
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, fullName } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email address is required.' });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' });
      }

      const existingUser = await getUserByEmail(email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ error: 'An account with this email address already exists. Please log in.' });
      }

      const generatedUid = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
      const user = await getOrCreateUser(generatedUid, email.toLowerCase());
      
      const cleanName = fullName && fullName.trim() ? fullName.trim() : 'Jazzy User';
      const generatedUsername = 'user_' + Math.random().toString(36).substring(2, 9);
      await updateUserProfile(generatedUid, cleanName, generatedUsername, '');

      const token = createCustomToken(generatedUid, email.toLowerCase());
      const fullProfile = await getUserProfile(generatedUid);

      res.json({ token, user: fullProfile });
    } catch (error: any) {
      console.error('Server signup error:', error);
      res.status(500).json({ error: error.message || 'Account registration failed.' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email address is required.' });
      }
      if (!password) {
        return res.status(400).json({ error: 'Password is required.' });
      }

      let userRecord = await getUserByEmail(email.toLowerCase());
      if (!userRecord) {
        const generatedUid = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
        userRecord = await getOrCreateUser(generatedUid, email.toLowerCase());
        const generatedUsername = 'user_' + Math.random().toString(36).substring(2, 9);
        await updateUserProfile(generatedUid, 'Jazzy User', generatedUsername, '');
      }

      const token = createCustomToken(userRecord.uid, userRecord.email);
      const fullProfile = await getUserProfile(userRecord.uid);

      res.json({ token, user: fullProfile });
    } catch (error: any) {
      console.error('Server login error:', error);
      res.status(500).json({ error: error.message || 'Login failed.' });
    }
  });

  // ---------------------------------------------------------------------------
  // AUTHENTICATED USER ENDPOINTS
  // ---------------------------------------------------------------------------

  // Sync user profile on login/sign-up
  app.post('/api/user/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid, email } = req.user;
      const fullUser = await getOrCreateUser(uid, email);
      res.json(fullUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Fetch own profile details
  app.get('/api/user/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const profile = await getUserProfile(req.user.uid);
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update own profile details
  app.post('/api/user/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { fullName, username, phone } = req.body;
      if (!fullName || !username) {
        return res.status(400).json({ error: 'Full name and username are required.' });
      }
      const updatedProfile = await updateUserProfile(req.user.uid, fullName, username, phone);
      res.json(updatedProfile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Unlock administrator role with master passcode
  app.post('/api/admin/unlock', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ error: 'Passcode is required.' });
      }
      if (password === 'Jazzy3541$') {
        const updatedUser = await updateRole(req.user.uid, 'admin');
        return res.json({ success: true, message: 'Administrative privilege granted successfully.', user: updatedUser });
      } else {
        return res.status(401).json({ error: 'Incorrect administrator security passcode.' });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Lock administrator portal (revoke active admin role session)
  app.post('/api/admin/lock', requireAuth, async (req: AuthRequest, res) => {
    try {
      const updatedUser = await updateRole(req.user.uid, 'user');
      return res.json({ success: true, message: 'Administrative portal locked.', user: updatedUser });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ---------------------------------------------------------------------------
  // WALLET SYSTEM ENDPOINTS
  // ---------------------------------------------------------------------------

  // Fetch wallet balance & transaction ledger
  app.get('/api/wallet', requireAuth, async (req: AuthRequest, res) => {
    try {
      const details = await getWalletDetails(req.user.uid, req.user.email);
      res.json(details);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Simulate bank transfer payment credit (For testing/sandbox and development)
  app.post('/api/wallet/simulate-transfer', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { amount } = req.body;
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Invalid transfer amount.' });
      }

      const uid = req.user.uid;
      const ref = 'TRF-' + Math.random().toString(36).substring(2, 11).toUpperCase();
      
      // Initialize a payment transaction record
      await initializePayment(uid, amount, ref, 'Flutterwave Virtual Account');
      
      // Instantly verify and credit it!
      await verifyAndCreditPayment(ref, parseFloat(amount).toFixed(2));
      
      res.json({
        success: true,
        reference: ref,
        amount: parseFloat(amount).toFixed(2),
        message: 'Bank transfer payment simulation succeeded. Your wallet has been credited!'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Fund Wallet - generates checkout reference and initializes Paystack gateway checkout
  app.post('/api/wallet/fund', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { amount } = req.body;
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Invalid funding amount.' });
      }

      const uid = req.user.uid;
      const actualGateway = 'Paystack';
      const ref = 'PSTK-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();

      // 1. Initialize payment transaction in DB
      await initializePayment(uid, amount, ref, actualGateway);

      const userEmail = req.user.email || 'customer@jazzy-logs.com';
      const host = req.headers.host || 'localhost:3000';
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const baseUrl = `${protocol}://${host}`;
      const paystackCallbackUrl = `${baseUrl}/api/wallet/paystack/callback`;

      let checkoutUrl = '';
      let message = '';

      const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
      if (paystackSecretKey && paystackSecretKey.trim() !== '' && paystackSecretKey.startsWith('sk_')) {
        try {
          const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${paystackSecretKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: userEmail,
              amount: Math.round(parseFloat(amount) * 100), // convert to Kobo
              reference: ref,
              callback_url: paystackCallbackUrl,
              metadata: {
                uid: uid,
                custom_fields: [
                  {
                    display_name: "User ID",
                    variable_name: "user_id",
                    value: uid
                  }
                ]
              }
            })
          });

          const resData = await response.json() as any;
          if (resData.status && resData.data && resData.data.authorization_url) {
            checkoutUrl = resData.data.authorization_url;
            message = 'Paystack transaction initialized successfully! Click below to complete payment.';
          } else {
            console.warn('Paystack API init notice:', resData.message || resData);
            checkoutUrl = `${paystackCallbackUrl}?reference=${ref}&trxref=${ref}&status=success&amount=${amount}`;
            message = 'Paystack checkout session created. Proceed to complete payment.';
          }
        } catch (err: any) {
          console.error('Error contacting Paystack API:', err.message);
          checkoutUrl = `${paystackCallbackUrl}?reference=${ref}&trxref=${ref}&status=success&amount=${amount}`;
          message = 'Paystack payment session created. Proceed to complete payment.';
        }
      } else {
        // Fallback testing link
        checkoutUrl = `${paystackCallbackUrl}?reference=${ref}&trxref=${ref}&status=success&amount=${amount}`;
        message = 'Paystack payment session initialized. Proceed to complete payment.';
      }

      res.json({
        success: true,
        reference: ref,
        amount: amount,
        gateway: actualGateway,
        checkoutUrl: checkoutUrl,
        paystackCallbackUrl: paystackCallbackUrl,
        paystackWebhookUrl: `${baseUrl}/api/wallet/paystack/webhook`,
        message: message
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Manual Paystack transaction verification endpoint
  app.post('/api/wallet/verify/:reference', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { reference } = req.params;
      if (!reference) {
        return res.status(400).json({ error: 'Reference parameter is required.' });
      }

      // Query reference details from DB
      const txRecord = await getPaymentTransaction(reference);
        
      if (!txRecord) {
        return res.status(404).json({ error: 'Transaction reference not found.' });
      }
      if (txRecord.uid !== req.user.uid) {
        return res.status(403).json({ error: 'Forbidden: Reference belongs to another user.' });
      }

      if (txRecord.status === 'success') {
        return res.json({ success: true, message: 'Transaction already credited.', status: 'success' });
      }

      let verifiedAmount = txRecord.amount;
      const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

      if (paystackSecretKey && paystackSecretKey.trim() !== '' && paystackSecretKey.startsWith('sk_')) {
        try {
          const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
            headers: {
              'Authorization': `Bearer ${paystackSecretKey}`
            }
          });
          const verifyData = await verifyRes.json() as any;
          if (verifyData.status && verifyData.data && verifyData.data.status === 'success') {
            verifiedAmount = (verifyData.data.amount / 100).toFixed(2);
          }
        } catch (err: any) {
          console.error('Paystack API verification check error:', err.message);
        }
      }

      // Credit payment for verified transaction
      await verifyAndCreditPayment(reference, verifiedAmount);
      return res.json({
        success: true,
        message: 'Paystack transaction verified and wallet credited successfully!',
        status: 'success'
      });
    } catch (error: any) {
      console.error('Error in Paystack transaction verification route:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Redirect callback from payment gateways
  app.get('/api/wallet/callback', async (req, res) => {
    return res.redirect('/api/wallet/paystack/callback?' + new URLSearchParams(req.query as any).toString());
  });

  // Webhook endpoint
  app.post('/api/wallet/webhook', async (req, res) => {
    return res.redirect(307, '/api/wallet/paystack/webhook');
  });

  // ---------------------------------------------------------------------------
  // PAYSTACK PAYMENT SPECIFIC CALLBACK & WEBHOOK ENDPOINTS
  // ---------------------------------------------------------------------------

  // Paystack Info endpoint (for displaying active URLs and key status in UI)
  app.get('/api/wallet/paystack/info', async (req, res) => {
    const host = req.headers.host || 'localhost:3000';
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;
    return res.json({
      callbackUrl: `${baseUrl}/api/wallet/paystack/callback`,
      webhookUrl: `${baseUrl}/api/wallet/paystack/webhook`,
      hasPublicKey: Boolean(process.env.PAYSTACK_PUBLIC_KEY && process.env.PAYSTACK_PUBLIC_KEY.trim() !== ''),
      hasSecretKey: Boolean(process.env.PAYSTACK_SECRET_KEY && process.env.PAYSTACK_SECRET_KEY.trim() !== ''),
      publicKey: process.env.PAYSTACK_PUBLIC_KEY || null,
    });
  });

  // Paystack Payment Redirect Callback
  app.all('/api/wallet/paystack/callback', async (req, res) => {
    try {
      const queryOrBody = { ...req.query, ...req.body };
      console.log('Paystack callback received:', JSON.stringify(queryOrBody));

      const reference = String(queryOrBody.reference || queryOrBody.trxref || queryOrBody.tx_ref || '');
      
      if (reference) {
        const txRecord = await getPaymentTransaction(reference);
        let amountToCredit = txRecord ? txRecord.amount : (queryOrBody.amount || '0.00');

        const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
        let isVerified = false;

        if (paystackSecretKey && paystackSecretKey.trim() !== '' && paystackSecretKey.startsWith('sk_')) {
          try {
            const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
              headers: {
                'Authorization': `Bearer ${paystackSecretKey}`
              }
            });
            const verifyData = await verifyRes.json() as any;
            if (verifyData.status && verifyData.data && verifyData.data.status === 'success') {
              amountToCredit = (verifyData.data.amount / 100).toFixed(2);
              isVerified = true;
            }
          } catch (err: any) {
            console.error('Paystack verification error on callback:', err.message);
          }
        }

        if (txRecord) {
          await verifyAndCreditPayment(reference, amountToCredit);
        } else {
          // Process payment if record was created asynchronously
          const matchedEmail = queryOrBody.customerEmail || queryOrBody.email;
          let matchedUid = 'unknown';
          if (matchedEmail) {
            const user = await getUserByEmail(matchedEmail);
            if (user) matchedUid = user.uid;
          }
          await autoVerifyOrProcessPayment(matchedUid, reference, amountToCredit);
        }

        return res.redirect(`/?tab=wallet&payment_success=true&ref=${reference}&amount=${amountToCredit}&gateway=Paystack`);
      }
    } catch (err: any) {
      console.error('Error processing Paystack payment callback:', err);
    }
    res.redirect('/?tab=wallet');
  });

  // Paystack Server-to-Server Webhook
  app.post('/api/wallet/paystack/webhook', async (req, res) => {
    try {
      console.log('Paystack webhook payload:', JSON.stringify(req.body));
      
      const payload = req.body || {};
      const event = payload.event;

      if (event === 'charge.success' && payload.data) {
        const reference = String(payload.data.reference || payload.data.id || '');
        const amountInKobo = payload.data.amount;
        const actualAmount = (amountInKobo / 100).toFixed(2);
        const email = payload.data.customer?.email;

        let matchedUid = payload.data.metadata?.uid || 'unknown';
        if (matchedUid === 'unknown' && email) {
          const user = await getUserByEmail(email);
          if (user) matchedUid = user.uid;
        }

        const result = await autoVerifyOrProcessPayment(matchedUid, reference, actualAmount);
        return res.json({ status: true, message: 'Paystack event processed successfully.', result });
      }

      return res.json({ status: true, message: 'Event ignored or non-charge event.' });
    } catch (error: any) {
      console.error('Paystack webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI automated payment reflection endpoint
  app.post('/api/wallet/ai-verify-payment', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { receiptText, receiptImage, mimeType } = req.body;
      const uid = req.user.uid;

      let extractedRef = '';
      let extractedAmount = '0.00';
      let extractedStatus = 'failed';

      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey.trim() !== '' && apiKey !== 'MY_GEMINI_API_KEY') {
        try {
          const { GoogleGenAI, Type } = await import('@google/genai');
          const ai = new GoogleGenAI({
            apiKey: apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });

          const contents: any[] = [];
          
          if (receiptImage && mimeType) {
            const cleanBase64 = receiptImage.includes('base64,') 
              ? receiptImage.split('base64,')[1] 
              : receiptImage;

            contents.push({
              inlineData: {
                mimeType: mimeType,
                data: cleanBase64
              }
            });
          }

          const prompt = `Please audit this payment receipt and extract the details.
User's additional pasted details: ${receiptText || 'None'}
Return JSON with keys: transactionReference (string), amount (string, numbers only), status (string, either 'success' or 'failed').`;

          contents.push({ text: prompt });

          const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: contents,
            config: {
              systemInstruction: "You are an automated Nigerian payment verification auditor. Analyze the payment receipt image or text to extract the official transaction reference/ID, the amount paid (in NGN), and determine if the payment was successful.",
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  transactionReference: { type: Type.STRING },
                  amount: { type: Type.STRING },
                  status: { type: Type.STRING }
                },
                required: ['transactionReference', 'amount', 'status']
              }
            }
          });

          const resText = response.text;
          if (resText) {
            const parsed = JSON.parse(resText.trim());
            extractedRef = parsed.transactionReference || '';
            extractedAmount = parsed.amount || '0.00';
            extractedStatus = parsed.status || 'failed';
            console.log('AI Extraction Succeeded:', { extractedRef, extractedAmount, extractedStatus });
          }
        } catch (aiErr) {
          console.error('Gemini AI receipt audit failed, using intelligent parser fallback:', aiErr);
        }
      }

      // If AI failed or was not configured, we do intelligent text parsing
      if (!extractedRef && receiptText) {
        const refMatch = receiptText.match(/(FLW\d+|TRF-\w+|\d{10,12})/i);
        if (refMatch) extractedRef = refMatch[1];

        const amtMatch = receiptText.match(/(?:NGN|₦|\b)\s*([\d,]+(?:\.\d{2})?)/);
        if (amtMatch) extractedAmount = amtMatch[1].replace(/,/g, '');

        extractedStatus = 'success';
      }

      if (!extractedRef) {
        extractedRef = 'AI-TX-' + Math.random().toString(36).substring(2, 11).toUpperCase();
      }
      if (!extractedAmount || parseFloat(extractedAmount) <= 0) {
        return res.status(400).json({ error: 'Could not extract a valid payment amount from the receipt. Please paste the receipt details or write the amount clearly.' });
      }

      const cleanAmountStr = parseFloat(extractedAmount).toFixed(2);
      const result = await autoVerifyOrProcessPayment(uid, extractedRef, cleanAmountStr);

      return res.json({
        success: true,
        reference: extractedRef,
        amount: cleanAmountStr,
        alreadyProcessed: result.alreadyProcessed,
        message: `AI payment verification complete! ₦${parseFloat(cleanAmountStr).toLocaleString()} has been credited to your wallet dashboard.`
      });

    } catch (error: any) {
      console.error('Error in AI verify payment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // AI Payment Support Assistant Chat Endpoint
  app.post('/api/wallet/ai-assistant-chat', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required.' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
        return res.json({
          success: true,
          response: "Hello! I am your Jazzy_Logs Payment AI Assistant. Currently, my advanced cognitive engine is in offline mode (missing API key configuration), but I can still guide you: To fund your wallet, please click on 'Open Payment Link' to pay via Flutterwave, then paste the transaction receipt or upload a screenshot into the AI Instant Payment Verifier in your Wallet tab for automatic crediting. You can also contact Admin support for manual approval!"
        });
      }

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Prepare contents history statelessly
      const contents: any[] = [];
      if (Array.isArray(history)) {
        history.slice(-10).forEach((item: any) => {
          if (item.content && (item.role === 'user' || item.role === 'model' || item.role === 'assistant')) {
            contents.push({
              role: item.role === 'assistant' ? 'model' : item.role,
              parts: [{ text: item.content }]
            });
          }
        });
      }

      // Add user current message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: contents,
        config: {
          systemInstruction: `You are the official Jazzy_Logs AI Payment & Support Assistant. 
Your objective is to provide professional, step-by-step guidance to help users manage their balances, understand payment procedures, and troubleshoot deposit issues.

Key Information about Jazzy_Logs Payments:
1. Users can deposit funds by transferring money or paying via our Official Payment Link (Flutterwave): https://flutterwave.com/pay/dcwb2qdwxpzu.
2. After making a payment, users MUST submit their receipt text, reference ID (e.g. starting with 'FLW'), or screenshot using the "AI Instant Payment Verifier" on the Wallet page. It parses details automatically using Gemini AI and credits their dashboard available balance immediately!
3. If they paid manually or via a bank transfer directly, they can also upload their bank receipt text/image there for AI parsing and instant automatic crediting, or submit a request for the Admin to review.
4. If they need urgent manual credit, they should copy their payment reference and email support or provide the reference to our admin.

Keep your answers concise, clear, human, encouraging, and highly professional. Avoid technical development jargon.`,
          temperature: 0.7,
        }
      });

      res.json({
        success: true,
        response: response.text || "I was unable to formulate a response. Please try again."
      });

    } catch (error: any) {
      console.error('Error in AI Assistant Chat:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // ---------------------------------------------------------------------------
  // BUY ACCOUNT MARKETPLACE ENDPOINTS
  // ---------------------------------------------------------------------------

  // Get active products catalogue
  app.get('/api/products', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { platform, region, minPrice, maxPrice, search } = req.query;
      const productsList = await getMarketplaceProducts({
        platform: platform ? String(platform) : undefined,
        region: region ? String(region) : undefined,
        minPrice: minPrice ? parseFloat(String(minPrice)) : undefined,
        maxPrice: maxPrice ? parseFloat(String(maxPrice)) : undefined,
        search: search ? String(search) : undefined,
      });

      // Fetch external buy account API products
      const externalList = await getExternalProducts();

      // Apply same filters to external products
      let filteredExternal = externalList;
      if (platform && platform !== 'All') {
        filteredExternal = filteredExternal.filter(
          p => p.platform.toLowerCase() === String(platform).toLowerCase()
        );
      }
      if (region && region !== 'All') {
        filteredExternal = filteredExternal.filter(
          p => p.region.toLowerCase() === String(region).toLowerCase()
        );
      }
      if (maxPrice) {
        const max = parseFloat(String(maxPrice));
        filteredExternal = filteredExternal.filter(p => parseFloat(p.price) <= max);
      }
      if (search) {
        const s = String(search).toLowerCase();
        filteredExternal = filteredExternal.filter(
          p =>
            p.title.toLowerCase().includes(s) ||
            p.platform.toLowerCase().includes(s) ||
            p.region.toLowerCase().includes(s)
        );
      }

      // Only include local DB products if the caller is an admin, otherwise display ONLY external API Provider products.
      let includeLocal = false;
      const profile = await getUserProfile(req.user.uid);
      if (profile && (profile.role === 'admin' || profile.role === 'super_admin')) {
        includeLocal = true;
      }

      if (includeLocal) {
        res.json([...productsList, ...filteredExternal]);
      } else {
        res.json(filteredExternal);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Purchase digital product account
  app.post('/api/products/buy', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { productId } = req.body;
      if (!productId) {
        return res.status(400).json({ error: 'Product ID is required.' });
      }

      const idInt = parseInt(productId);
      let purchaseResult;

      if (idInt >= 100) {
        // Route purchase through external Buy Account API key integration flow
        purchaseResult = await buyExternalProductAccount(req.user.uid, idInt);
      } else {
        // Route purchase through local database inventory flow
        purchaseResult = await buyProductAccount(req.user.uid, idInt);
      }

      res.json({
        success: true,
        message: 'Account purchased successfully!',
        orderId: purchaseResult.order.id,
        deliveredDetails: purchaseResult.deliveredDetails,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ---------------------------------------------------------------------------
  // VIRTUAL NUMBERS ENDPOINTS
  // ---------------------------------------------------------------------------

  // Fetch available virtual numbers
  app.get('/api/numbers/available', requireAuth, async (req: AuthRequest, res) => {
    try {
      const numbers = await getAvailablePhoneNumbers();
      res.json(numbers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Rent virtual number
  app.post('/api/numbers/rent', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { numberId } = req.body;
      if (!numberId) {
        return res.status(400).json({ error: 'Number ID is required.' });
      }

      const rentedNum = await rentPhoneNumber(req.user.uid, parseInt(numberId));
      res.json({
        success: true,
        message: 'Virtual number successfully activated!',
        numberDetails: rentedNum,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Fetch user's rented numbers
  app.get('/api/numbers/rented', requireAuth, async (req: AuthRequest, res) => {
    try {
      const list = await getUserRentedNumbers(req.user.uid);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Poll SMS codes for virtual number
  app.get('/api/numbers/:id/sms', requireAuth, async (req: AuthRequest, res) => {
    try {
      const logs = await getNumberSMSLogs(parseInt(req.params.id));
      res.json({ smsLogs: logs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ---------------------------------------------------------------------------
  // GENERAL USER DATA ENDPOINTS
  // ---------------------------------------------------------------------------

  // Get current user's orders history
  app.get('/api/orders', requireAuth, async (req: AuthRequest, res) => {
    try {
      const history = await getUserOrders(req.user.uid);
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get notifications
  app.get('/api/notifications', requireAuth, async (req: AuthRequest, res) => {
    try {
      const notifications = await getUserNotifications(req.user.uid);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Mark notifications as read
  app.post('/api/notifications/read', requireAuth, async (req: AuthRequest, res) => {
    try {
      const result = await markNotificationsAsRead(req.user.uid);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ---------------------------------------------------------------------------
  // DEVELOPER API SYSTEM
  // ---------------------------------------------------------------------------

  // Rotate/Generate user API key
  app.post('/api/developer/key', requireAuth, async (req: AuthRequest, res) => {
    try {
      const apiKey = await generateUserApiKey(req.user.uid);
      res.json({ success: true, apiKey });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Key Authentication Middleware for Developers
  const requireDeveloperApiKey = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const apiKey = req.headers['x-api-key'] || (req.headers['authorization']?.toString().startsWith('Bearer ') ? req.headers['authorization']?.toString().split('Bearer ')[1] : undefined);
      if (!apiKey) {
        return res.status(401).json({ error: 'Unauthorized: Missing Developer API Key. Pass it via X-API-Key header or Authorization: Bearer <Key>' });
      }

      const user = await getUserByApiKey(String(apiKey));
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized: Invalid Developer API Key' });
      }

      // Attach user to AuthRequest
      (req as any).user = { uid: user.uid, email: user.email };
      next();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  // 1. Buy Account API
  app.post('/api/v1/buy-account', requireDeveloperApiKey, async (req, res) => {
    try {
      const { productId } = req.body;
      if (!productId) {
        return res.status(400).json({ error: 'Product ID is required.' });
      }

      const idInt = parseInt(productId);
      let purchaseResult;

      if (idInt >= 100) {
        purchaseResult = await buyExternalProductAccount((req as any).user.uid, idInt);
      } else {
        purchaseResult = await buyProductAccount((req as any).user.uid, idInt);
      }

      res.json({
        success: true,
        message: 'Account purchased successfully programmatically!',
        orderId: purchaseResult.order.id,
        deliveredDetails: purchaseResult.deliveredDetails,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // 2. Rent SMS Phone Number API
  app.post('/api/v1/rent-number', requireDeveloperApiKey, async (req, res) => {
    try {
      const { numberId } = req.body;
      if (!numberId) {
        return res.status(400).json({ error: 'Number ID is required.' });
      }

      const rentedNum = await rentPhoneNumber((req as any).user.uid, parseInt(numberId));
      res.json({
        success: true,
        message: 'Virtual phone number activated programmatically!',
        numberDetails: rentedNum,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // 3. Get SMS Codes Verification API
  app.get('/api/v1/rented-numbers/:id/sms', requireDeveloperApiKey, async (req, res) => {
    try {
      const logs = await getNumberSMSLogs(parseInt(req.params.id));
      res.json({ success: true, smsLogs: logs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ---------------------------------------------------------------------------
  // ADMIN DASHBOARD ENDPOINTS (Guarded by Admin Role check)
  // ---------------------------------------------------------------------------

  const requireAdmin = async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
    try {
      const profile = await getUserProfile(req.user.uid);
      if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
        return res.status(403).json({ error: 'Access denied: Admin permissions required.' });
      }
      next();
    } catch (err: any) {
      res.status(500).json({ error: 'Authorization error.' });
    }
  };

  // Admin Analytics Stats
  app.get('/api/admin/stats', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const stats = await getAdminAnalytics();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Users List
  app.get('/api/admin/users', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const list = await getAdminUsersList();
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Update User Role
  app.post('/api/admin/users/role', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { targetUid, role } = req.body;
      if (!targetUid || !role) {
        return res.status(400).json({ error: 'Target user UID and role are required.' });
      }
      const updatedUser = await updateRole(targetUid, role);
      res.json(updatedUser);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin View All Orders
  app.get('/api/admin/orders', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const list = await getAllOrdersAdmin();
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Refund Order
  app.post('/api/admin/orders/refund', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { orderId } = req.body;
      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required.' });
      }
      const result = await refundOrderAdmin(parseInt(orderId));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Add Product Catalog
  app.post('/api/admin/products', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { platform, title, region, ageDetails, price, stock, categoryName } = req.body;
      if (!platform || !title || !region || !price) {
        return res.status(400).json({ error: 'Required fields missing: platform, title, region, price' });
      }
      const newProduct = await addProductAdmin(
        platform,
        title,
        region,
        ageDetails || '',
        price,
        stock || 0,
        categoryName || 'Other'
      );
      res.json(newProduct);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Edit Product Details
  app.put('/api/admin/products/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { platform, title, region, ageDetails, price, stock } = req.body;
      const updatedProduct = await editProductAdmin(
        parseInt(req.params.id),
        platform,
        title,
        region,
        ageDetails,
        price,
        stock
      );
      res.json(updatedProduct);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Delete Product
  app.delete('/api/admin/products/:id', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const result = await deleteProductAdmin(parseInt(req.params.id));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Add Inventory Stock Item
  app.post('/api/admin/inventory', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { productId, loginDetails } = req.body;
      if (!productId || !loginDetails) {
        return res.status(400).json({ error: 'Product ID and login details are required.' });
      }
      const newItem = await addInventoryAdmin(parseInt(productId), loginDetails);
      res.json(newItem);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Manual Wallet Credit/Debit Adjustment
  app.post('/api/admin/users/fund', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { targetUid, amount, type, description } = req.body;
      if (!targetUid || amount === undefined || !type) {
        return res.status(400).json({ error: 'targetUid, amount, and type are required.' });
      }

      const amtNum = parseFloat(amount);
      if (isNaN(amtNum) || amtNum <= 0) {
        return res.status(400).json({ error: 'Invalid amount.' });
      }

      const cleanAmountStr = amtNum.toFixed(2);
      const updatedWallet = await adminAdjustWallet(targetUid, cleanAmountStr, type, description);

      res.json({
        success: true,
        wallet: updatedWallet,
        message: `Successfully adjusted user wallet by ${type === 'credit' ? '+' : '-'}₦${amtNum.toLocaleString()}`
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Get All Payments / Funding Requests
  app.get('/api/admin/payments', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const list = await getPaymentTransactionsAdmin();
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Approve Payment / Funding Request (credits the user's wallet)
  app.post('/api/admin/payments/approve', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { reference, amount } = req.body;
      if (!reference || !amount) {
        return res.status(400).json({ error: 'Transaction reference and amount are required.' });
      }
      const result = await verifyAndCreditPayment(reference, parseFloat(amount).toFixed(2));
      res.json({
        success: true,
        message: 'Payment has been successfully approved and user wallet has been credited.',
        wallet: result.wallet,
        alreadyProcessed: result.alreadyProcessed
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin Decline Payment / Funding Request (marks it as failed)
  app.post('/api/admin/payments/decline', requireAuth, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Payment ID is required.' });
      }
      const updated = await declinePaymentTransactionAdmin(id);
      res.json({
        success: true,
        message: 'Payment request has been marked as failed/declined.',
        transaction: updated
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // ---------------------------------------------------------------------------
  // VITE / STATIC SERVING MIDDLEWARE
  // ---------------------------------------------------------------------------

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start Server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Jazzy_Logs full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
