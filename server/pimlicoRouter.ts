import { Router, Request, Response } from 'express';
import { 
  getAWalletAccountInfo, 
  getAWalletBalance, 
  executeAWalletTransaction, 
  EXECUTE_AWALLET_TRANSACTION_DECLARATION,
  AWALLET_SMART_ACCOUNT_ADDRESS,
  ENTRY_POINT_V07_ADDRESS,
  BASE_SEPOLIA_CHAIN_ID,
  VERIFIED_TRANSACTIONS,
  BASE_SEPOLIA_USDC_ADDRESS,
  encodeErc20TransferCall
} from '../awallet-pimlico.ts';

export const pimlicoRouter = Router();

// GET Verified On-Chain Transactions on Base Sepolia
pimlicoRouter.get('/verified-txs', (req: Request, res: Response) => {
  res.json({
    success: true,
    smartAccount: AWALLET_SMART_ACCOUNT_ADDRESS,
    transactions: VERIFIED_TRANSACTIONS,
    usdcAddress: BASE_SEPOLIA_USDC_ADDRESS,
  });
});

// POST Generate ERC-20 Transfer callData for Contract Calls
pimlicoRouter.post('/erc20-call-data', (req: Request, res: Response) => {
  try {
    const { recipient = '0x000000000000000000000000000000000000dEaD', amount = '1.0', decimals = 6 } = req.body;
    const callData = encodeErc20TransferCall(recipient, amount, Number(decimals));
    res.json({
      success: true,
      to: BASE_SEPOLIA_USDC_ADDRESS,
      data: callData,
      recipient,
      amount,
      token: 'USDC (Base Sepolia)',
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err?.message || 'Invalid callData generation' });
  }
});

// GET Account Information and on-chain verification
pimlicoRouter.get('/account', async (req: Request, res: Response) => {
  try {
    const accountInfo = await getAWalletAccountInfo();
    res.json({
      success: true,
      account: accountInfo,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to retrieve account info',
    });
  }
});

// GET Live On-chain Balance for Base Sepolia Smart Account
pimlicoRouter.get('/balance', async (req: Request, res: Response) => {
  try {
    const address = (req.query.address as string) || AWALLET_SMART_ACCOUNT_ADDRESS;
    const balance = await getAWalletBalance(address as `0x${string}`);
    res.json({
      success: true,
      balance,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err?.message || 'Failed to query on-chain balance',
    });
  }
});

// GET Function Calling Tool Declaration Schema
pimlicoRouter.get('/tool-declaration', (req: Request, res: Response) => {
  res.json({
    tool: EXECUTE_AWALLET_TRANSACTION_DECLARATION,
    smartAccount: AWALLET_SMART_ACCOUNT_ADDRESS,
    entryPoint: ENTRY_POINT_V07_ADDRESS,
    chainId: BASE_SEPOLIA_CHAIN_ID,
  });
});

// POST Execute Gasless Transaction via Pimlico 5-Step Pipeline
pimlicoRouter.post('/execute', async (req: Request, res: Response) => {
  try {
    const { to, data = '0x', value = '0' } = req.body;

    if (!to || typeof to !== 'string' || !to.startsWith('0x') || to.length !== 42) {
      return res.status(400).json({
        success: false,
        error: 'Valid "to" destination address (0x...) is required.',
      });
    }

    const result = await executeAWalletTransaction({
      to,
      data,
      value,
    });

    return res.json(result);
  } catch (err: any) {
    console.error('[PimlicoRouter] Execution error:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Pimlico UserOperation execution failed',
    });
  }
});
