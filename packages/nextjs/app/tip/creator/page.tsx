"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatEther, parseEther } from "viem";
import { useAccount, useBalance, useChainId } from "wagmi";
import { notification } from "~~/utils/scaffold-eth";

export default function TipPage() {
  const params = useParams();
  const router = useRouter();
  const ensName = params?.ensName as string;
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const [tipAmount, setTipAmount] = useState("");
  const [tipMessage, setTipMessage] = useState("");
  const [isValidAmount, setIsValidAmount] = useState(false);
  const [amountError, setAmountError] = useState("");
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get user's balance
  const { data: balance } = useBalance({
    address: address,
    query: {
      enabled: !!address && mounted, // ✅ This is correct
    },
  });

  // Mock creator data for testing
  const creator = {
    isRegistered: true,
    totalTips: BigInt("1000000000000000000"), // 1 MATIC
    tipCount: 5,
    creatorAddress: "0x123...",
  };

  // Validate tip amount
  useEffect(() => {
    const validateAmount = () => {
      if (!tipAmount) {
        setIsValidAmount(false);
        setAmountError("");
        return;
      }

      const amount = parseFloat(tipAmount);

      if (isNaN(amount) || amount <= 0) {
        setIsValidAmount(false);
        setAmountError("Please enter a valid amount");
        return;
      }

      const minAmount = 0.001;
      if (amount < minAmount) {
        setIsValidAmount(false);
        setAmountError(`Minimum tip amount is ${minAmount} MATIC`);
        return;
      }

      if (amount > 100) {
        setIsValidAmount(false);
        setAmountError("Maximum tip amount is 100 MATIC");
        return;
      }

      if (balance && parseEther(tipAmount) > balance.value) {
        setIsValidAmount(false);
        setAmountError("Insufficient balance");
        return;
      }

      setIsValidAmount(true);
      setAmountError("");
    };

    validateAmount();
  }, [tipAmount, balance]);

  const handleTip = async () => {
    if (!tipAmount || !isValidAmount || !isConnected) return;

    // Mock tip sending
    console.log(`Sending ${tipAmount} MATIC to ${ensName}`);
    console.log(`Message: ${tipMessage}`);

    // Simulate success
    setTipAmount("");
    setTipMessage("");
    notification.success("Tip sent successfully! (Mock)");
  };

  const quickAmounts = ["0.01", "0.05", "0.1", "0.5", "1"];

  const getNetworkName = () => {
    if (chainId === 137) return "Polygon";
    if (chainId === 80001) return "Polygon Mumbai";
    return "Unknown Network";
  };

  // Don't render until mounted (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Check if ensName exists
  if (!ensName) {
    return (
      <div className="flex items-center flex-col flex-grow pt-20">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-4xl font-bold mb-4">Invalid URL</h1>
          <p className="text-xl text-gray-600 mb-6">No ENS name provided in the URL.</p>
          <button className="btn btn-primary" onClick={() => router.push("/")}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const totalTipsFormatted = creator.totalTips ? formatEther(creator.totalTips) : "0";

  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💰</div>
          <h1 className="text-4xl font-bold mb-2">Tip {ensName}</h1>
          <div className="stats stats-horizontal shadow bg-base-200 mb-4">
            <div className="stat place-items-center">
              <div className="stat-title">Total Tips</div>
              <div className="stat-value text-primary">{Number(totalTipsFormatted).toFixed(3)}</div>
              <div className="stat-desc">MATIC</div>
            </div>
            <div className="stat place-items-center">
              <div className="stat-title">Tips Count</div>
              <div className="stat-value text-secondary">{creator.tipCount}</div>
              <div className="stat-desc">supporters</div>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="alert alert-info mb-6">
          <div className="text-sm">
            <p>
              <strong>Debug Info:</strong>
            </p>
            <p>ENS: {ensName}</p>
            <p>Connected: {isConnected ? "Yes" : "No"}</p>
            <p>Chain ID: {chainId}</p>
            <p>Address: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}</p>
          </div>
        </div>

        {/* Main Tip Interface */}
        <div className="flex flex-col bg-base-100 px-6 md:px-10 py-10 rounded-3xl shadow-lg mb-6">
          {!isConnected ? (
            <div className="text-center">
              <p className="text-lg mb-4">Connect your wallet to send a tip</p>
              <div className="alert alert-info">
                <span>💡 Tips are sent directly to the creator with no fees!</span>
              </div>
            </div>
          ) : (
            <>
              {/* Network Status */}
              <div className="mb-6">
                {chainId !== 137 && chainId !== 80001 ? (
                  <div className="alert alert-warning">
                    <span>⚠️ Switch to Polygon network for cheaper transactions</span>
                    <div>Current: {getNetworkName()}</div>
                  </div>
                ) : (
                  <div className="alert alert-success">
                    <span>✅ Connected to {getNetworkName()}</span>
                    {balance && <div>Balance: {Number(formatEther(balance.value)).toFixed(4)} MATIC</div>}
                  </div>
                )}
              </div>

              {/* Quick Amount Buttons */}
              <div className="mb-6">
                <label className="label">
                  <span className="label-text text-lg font-semibold">Quick Amounts (MATIC)</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {quickAmounts.map(amount => (
                    <button
                      key={amount}
                      className={`btn btn-sm ${tipAmount === amount ? "btn-primary" : "btn-outline"}`}
                      onClick={() => setTipAmount(amount)}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount Input */}
              <div className="mb-6">
                <label className="label">
                  <span className="label-text text-lg font-semibold">Custom Amount (MATIC)</span>
                </label>
                <input
                  type="number"
                  placeholder="0.1"
                  step="0.001"
                  min="0"
                  max="100"
                  className={`input input-bordered w-full text-center text-lg ${
                    amountError ? "input-error" : isValidAmount && tipAmount ? "input-success" : ""
                  }`}
                  value={tipAmount}
                  onChange={e => setTipAmount(e.target.value)}
                />
                {amountError && (
                  <div className="label">
                    <span className="label-text-alt text-error">{amountError}</span>
                  </div>
                )}
                {isValidAmount && tipAmount && (
                  <div className="label">
                    <span className="label-text-alt text-success">✓ Valid amount</span>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="mb-6">
                <label className="label">
                  <span className="label-text font-semibold">Message (Optional)</span>
                </label>
                <textarea
                  placeholder="Leave a nice message for the creator..."
                  className="textarea textarea-bordered w-full"
                  maxLength={280}
                  value={tipMessage}
                  onChange={e => setTipMessage(e.target.value)}
                  rows={3}
                />
                <div className="label">
                  <span className="label-text-alt">{tipMessage.length}/280 characters</span>
                </div>
              </div>

              {/* Send Tip Button */}
              <button
                className={`btn btn-lg w-full mb-4 ${!isValidAmount ? "btn-disabled" : "btn-primary"}`}
                onClick={handleTip}
                disabled={!isValidAmount}
              >
                Send {tipAmount || "0"} MATIC Tip 🚀
              </button>

              <div className="text-center text-sm text-gray-600">
                <p>💡 Tips are sent instantly to the creator wallet</p>
                <p>🔒 No platform fees • Secure transactions</p>
                <p className="text-orange-500 mt-2">⚠️ This is currently a mock version for testing</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
