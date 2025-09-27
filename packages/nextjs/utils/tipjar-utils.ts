// utils/tipjar-utils.ts
import { formatEther, parseEther } from "viem";
import { notification } from "~~/utils/scaffold-eth";

export interface Creator {
  wallet: string;
  ensName: string;
  totalTips: bigint;
  tipCount: bigint;
  isRegistered: boolean;
  registeredAt: bigint;
}

export interface TipData {
  tipper: string;
  amount: bigint;
  timestamp: bigint;
  message: string;
}

export interface ContractStats {
  totalCreators: bigint;
  totalTipsAmount: bigint;
  minTipAmount: bigint;
}

// ENS Validation
export const validateENS = (ensName: string): { isValid: boolean; error: string } => {
  if (!ensName) {
    return { isValid: false, error: "" };
  }

  if (ensName.length > 100) {
    return { isValid: false, error: "ENS name is too long" };
  }

  // Basic ENS validation - must end with .eth and contain valid characters
  const ensRegex = /^[a-z0-9-]+\.eth$/i;
  if (!ensRegex.test(ensName)) {
    return { isValid: false, error: "Please enter a valid ENS name (e.g., yourname.eth)" };
  }

  // Check for invalid characters or patterns
  if (ensName.includes("--") || ensName.startsWith("-") || ensName.includes("-.")) {
    return { isValid: false, error: "ENS name contains invalid characters" };
  }

  return { isValid: true, error: "" };
};

// Tip Amount Validation
export const validateTipAmount = (
  amount: string, 
  balance?: bigint, 
  minAmount?: bigint
): { isValid: boolean; error: string } => {
  if (!amount) {
    return { isValid: false, error: "" };
  }

  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount) || numAmount <= 0) {
    return { isValid: false, error: "Please enter a valid amount" };
  }

  // Check minimum amount
  const minAmountEth = minAmount ? Number(formatEther(minAmount)) : 0.001;
  if (numAmount < minAmountEth) {
    return { isValid: false, error: `Minimum tip amount is ${minAmountEth} MATIC` };
  }

  // Check maximum amount
  if (numAmount > 100) {
    return { isValid: false, error: "Maximum tip amount is 100 MATIC" };
  }

  // Check user balance
  if (balance) {
    try {
      const amountWei = parseEther(amount);
      if (amountWei > balance) {
        return { isValid: false, error: "Insufficient balance" };
      }
    } catch (error) {
      return { isValid: false, error: "Invalid amount format" };
    }
  }

  return { isValid: true, error: "" };
};

// Format address for display
export const formatAddress = (address: string, chars = 4): string => {
  if (!address) return "";
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

// Format timestamp for display
export const formatTimestamp = (timestamp: bigint | number, includeTime = true): string => {
  const date = new Date(Number(timestamp) * 1000);
  const dateStr = date.toLocaleDateString();
  
  if (!includeTime) return dateStr;
  
  const timeStr = date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  return `${dateStr} ${timeStr}`;
};

// Format MATIC amount for display
export const formatMatic = (amount: bigint, decimals = 4): string => {
  const formatted = formatEther(amount);
  return Number(formatted).toFixed(decimals);
};

// Copy to clipboard with fallback
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      notification.success("Copied to clipboard!");
      return true;
    }
  } catch (error) {
    console.warn("Modern clipboard API failed, using fallback");
  }

  // Fallback for older browsers
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const result = document.execCommand("copy");
    document.body.removeChild(textArea);
    
    if (result) {
      notification.success("Copied to clipboard!");
      return true;
    }
  } catch (error) {
    console.error("Fallback clipboard copy failed:", error);
  }

  notification.error("Failed to copy to clipboard");
  return false;
};

// Get network info
export const getNetworkInfo = (chainId?: number) => {
  switch (chainId) {
    case 137:
      return { name: "Polygon", isSupported: true, color: "success" };
    case 80001:
      return { name: "Polygon Mumbai", isSupported: true, color: "warning" };
    case 1:
      return { name: "Ethereum", isSupported: false, color: "error" };
    default:
      return { name: "Unknown", isSupported: false, color: "error" };
  }
};

// Handle transaction errors
export const handleTransactionError = (error: any): string => {
  if (error?.message?.includes("user rejected")) {
    return "Transaction cancelled by user";
  }
  
  if (error?.message?.includes("insufficient funds")) {
    return "Insufficient funds for transaction";
  }
  
  if (error?.message?.includes("ENS already registered")) {
    return "This ENS name is already registered";
  }
  
  if (error?.message?.includes("Creator not registered")) {
    return "Creator not found or not registered";
  }
  
  if (error?.message?.includes("Tip amount too small")) {
    return "Tip amount is below minimum required";
  }
  
  if (error?.message?.includes("Transfer failed")) {
    return "Transfer to creator failed";
  }

  // Generic error message
  return error?.message || "Transaction failed. Please try again.";
};

// Generate share link
export const generateShareLink = (ensName: string): string => {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/tip/${ensName}`;
};

// Validate message length
export const validateMessage = (message: string, maxLength = 280): { isValid: boolean; error: string } => {
  if (message.length > maxLength) {
    return { isValid: false, error: `Message too long (${message.length}/${maxLength})` };
  }
  return { isValid: true, error: "" };
};

// Format large numbers
export const formatNumber = (num: bigint | number): string => {
  const value = typeof num === 'bigint' ? Number(num) : num;
  
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toString();
};

// Rate limiting for API calls
export class RateLimiter {
  private calls: number[] = [];
  private readonly maxCalls: number;
  private readonly timeWindow: number;

  constructor(maxCalls = 10, timeWindowMs = 60000) {
    this.maxCalls = maxCalls;
    this.timeWindow = timeWindowMs;
  }

  canMakeCall(): boolean {
    const now = Date.now();
    this.calls = this.calls.filter(callTime => now - callTime < this.timeWindow);
    return this.calls.length < this.maxCalls;
  }

  recordCall(): void {
    this.calls.push(Date.now());
  }
}

// Create a singleton rate limiter
export const contractCallLimiter = new RateLimiter(20, 60000); // 20 calls per minute