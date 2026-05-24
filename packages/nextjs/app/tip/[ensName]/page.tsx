"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatEther, parseEther } from "viem";
import { useAccount, useBalance, useChainId } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export default function DynamicTipPage() {
  const params = useParams();
  const router = useRouter();
  const rawEnsName = params?.ensName as string;
  // Decode the URL encoded string (e.g. %20 -> spaces)
  const ensName = rawEnsName ? decodeURIComponent(rawEnsName) : "";

  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const [tipAmount, setTipAmount] = useState("");
  const [tipMessage, setTipMessage] = useState(""); // Kept for UI compatibility, contract tip() only takes name
  const [isValidAmount, setIsValidAmount] = useState(false);
  const [amountError, setAmountError] = useState("");
  const [mounted, setMounted] = useState(false);

  // Handle hydration to prevent mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch creator data directly from smart contract (read-only mapping call)
  const {
    data: creatorData,
    isLoading: isLoadingCreator,
    refetch: refetchCreator,
  } = useScaffoldReadContract({
    contractName: "TipJar",
    functionName: "creators",
    args: [ensName],
  });

  // Extract variables safely from the contract return
  // creators public mapping returns a tuple/array: [wallet, ensName, totalTips, tipCount, isRegistered]
  const creatorWallet = creatorData ? creatorData[0] : undefined;
  const totalTips = creatorData ? creatorData[2] : BigInt(0);
  const tipCount = creatorData ? Number(creatorData[3]) : 0;
  const isRegistered = creatorData ? creatorData[4] : false;

  // Get user's balance
  const { data: balance } = useBalance({
    address: address,
    query: {
      enabled: !!address && mounted,
    },
  });

  // Setup write hook for the tip function
  const { writeContractAsync: writeTipContract, isMining } = useScaffoldWriteContract({
    contractName: "TipJar",
  });

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

      const minAmount = 0.0001;
      if (amount < minAmount) {
        setIsValidAmount(false);
        setAmountError(`Minimum tip amount is ${minAmount} ETH/MATIC`);
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

    try {
      const tipInWei = parseEther(tipAmount);

      notification.info("Initiating tipping transaction...");

      // Execute the on-chain smart contract call
      await writeTipContract({
        functionName: "tip",
        args: [ensName],
        value: tipInWei,
      });

      notification.success("Thank you! Tip sent successfully on-chain! 🎉");
      setTipAmount("");
      setTipMessage("");

      // Refetch the creator's live statistics from the contract
      refetchCreator();
    } catch (e: any) {
      console.error(e);
      notification.error(e?.message || "Transaction failed or was rejected.");
    }
  };

  const quickAmounts = ["0.001", "0.01", "0.05", "0.1", "0.5"];

  const getNetworkName = () => {
    if (chainId === 31337) return "Hardhat Local";
    if (chainId === 137) return "Polygon";
    if (chainId === 80002) return "Polygon Amoy";
    return "Unknown Network";
  };

  // Don't render until mounted (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-base-300 via-base-100 to-base-300">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // Check if ensName exists
  if (!ensName) {
    return (
      <div className="flex items-center flex-col flex-grow pt-20 px-4">
        <div className="text-center max-w-md bg-base-100 p-8 rounded-3xl shadow-2xl border border-base-300">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-4xl font-bold mb-4">Invalid Link</h1>
          <p className="text-xl text-gray-500 mb-6">No creator identifier was provided in the URL.</p>
          <button className="btn btn-primary w-full" onClick={() => router.push("/")}>
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingCreator) {
    return (
      <div className="flex justify-center items-center flex-col flex-grow pt-20">
        <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
        <p className="text-sm font-medium">Fetching creator registry details...</p>
      </div>
    );
  }

  // If creator is not registered in the smart contract
  if (!isRegistered) {
    return (
      <div className="flex items-center flex-col flex-grow pt-20 px-4">
        <div className="text-center max-w-md bg-base-100 p-8 rounded-3xl shadow-2xl border border-base-300">
          <div className="text-6xl mb-4">🤷‍♂️</div>
          <h1 className="text-3xl font-bold mb-4">Creator Not Found</h1>
          <p className="text-gray-500 mb-6">
            The profile <span className="font-semibold text-primary">&quot;{ensName}&quot;</span> is not registered on
            Clapcoin yet.
          </p>
          <div className="flex flex-col gap-2">
            <button className="btn btn-primary" onClick={() => router.push("/tip/creator")}>
              Register this Name!
            </button>
            <button className="btn btn-ghost" onClick={() => router.push("/")}>
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalTipsFormatted = totalTips ? formatEther(totalTips) : "0";

  return (
    <div className="flex items-center flex-col flex-grow pt-10 px-4 bg-gradient-to-br from-base-300 via-base-100 to-base-300 min-h-screen pb-16">
      <div className="w-full max-w-2xl">
        {/* Profile Card Header */}
        <div className="text-center mb-8 bg-base-100/60 backdrop-blur-md px-8 py-6 rounded-3xl shadow-xl border border-base-200">
          <div className="avatar placeholder mb-3">
            <div className="bg-primary text-primary-content rounded-full w-24 shadow-lg ring ring-primary ring-offset-base-100 ring-offset-2">
              <span className="text-4xl font-bold">🎨</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Tip {ensName}</h1>
          <p className="text-xs font-mono text-gray-500 truncate max-w-md mx-auto mb-4 bg-base-200/50 p-2 rounded-lg">
            Wallet: {creatorWallet}
          </p>
          <div className="stats stats-horizontal shadow-md bg-base-100/80 border border-base-200 w-full mt-2">
            <div className="stat place-items-center py-4">
              <div className="stat-title text-sm">Total Tipped</div>
              <div className="stat-value text-primary text-3xl font-black">{Number(totalTipsFormatted).toFixed(4)}</div>
              <div className="stat-desc font-semibold text-xs mt-1 text-gray-400">NATIVE TOKENS</div>
            </div>
            <div className="stat place-items-center py-4">
              <div className="stat-title text-sm">Claps Given</div>
              <div className="stat-value text-secondary text-3xl font-black">{tipCount}</div>
              <div className="stat-desc font-semibold text-xs mt-1 text-gray-400">SUPPORTERS</div>
            </div>
          </div>
        </div>

        {/* Main Card Interface */}
        <div className="flex flex-col bg-base-100 p-8 md:p-10 rounded-3xl shadow-xl border border-base-200 relative overflow-hidden">
          {/* Decorative Corner Glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>

          {!isConnected ? (
            <div className="text-center py-6">
              <span className="text-5xl mb-4 block">🔌</span>
              <p className="text-lg font-semibold mb-6">Connect your wallet to send a tip</p>
              <div className="alert alert-info bg-info/10 border border-info/20 rounded-2xl">
                <span>💡 Tips are transferred directly to the creator on-chain with absolutely 0% platform fees!</span>
              </div>
            </div>
          ) : (
            <>
              {/* Network Status Banner */}
              <div className="mb-6">
                {chainId !== 31337 && chainId !== 137 ? (
                  <div className="alert alert-warning shadow-md rounded-2xl flex flex-col sm:flex-row items-center justify-between">
                    <span className="text-sm">⚠️ Connect to Local Hardhat or Polygon Mainnet for transactions.</span>
                    <div className="badge badge-warning font-semibold text-xs mt-2 sm:mt-0">
                      Network: {getNetworkName()}
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-success shadow-sm rounded-2xl flex justify-between items-center bg-success/15 border border-success/30 text-success-content">
                    <span className="text-sm font-medium">✅ Wallet Connected</span>
                    {balance && (
                      <span className="text-sm font-bold">
                        {Number(formatEther(balance.value)).toFixed(4)} {balance.symbol}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Quick Amount Selector */}
              <div className="mb-6">
                <label className="label">
                  <span className="label-text text-lg font-semibold text-base-content/80">Select Tip Amount</span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {quickAmounts.map(amount => (
                    <button
                      key={amount}
                      className={`btn btn-md font-bold rounded-xl transition-all duration-200 ${
                        tipAmount === amount
                          ? "btn-primary shadow-lg scale-105"
                          : "btn-outline border-base-300 hover:btn-primary"
                      }`}
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
                  <span className="label-text text-lg font-semibold text-base-content/80">
                    Custom Amount (ETH/MATIC)
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.05"
                    step="0.0001"
                    min="0"
                    className={`input input-bordered w-full text-center text-xl font-bold h-14 rounded-2xl ${
                      amountError
                        ? "input-error bg-error/5"
                        : isValidAmount && tipAmount
                          ? "input-success bg-success/5"
                          : ""
                    }`}
                    value={tipAmount}
                    onChange={e => setTipAmount(e.target.value)}
                  />
                  {tipAmount && <div className="absolute right-4 top-4 font-bold text-gray-400">{balance?.symbol}</div>}
                </div>
                {amountError && (
                  <div className="label">
                    <span className="label-text-alt text-error font-medium">{amountError}</span>
                  </div>
                )}
                {isValidAmount && tipAmount && (
                  <div className="label">
                    <span className="label-text-alt text-success font-semibold">✓ Funds verified & amount valid</span>
                  </div>
                )}
              </div>

              {/* Tipping Message (Optional) */}
              <div className="mb-8">
                <label className="label">
                  <span className="label-text font-semibold text-base-content/80">
                    Message for the Creator (Optional)
                  </span>
                </label>
                <textarea
                  placeholder="Say something inspiring to support their work..."
                  className="textarea textarea-bordered w-full rounded-2xl"
                  maxLength={140}
                  value={tipMessage}
                  onChange={e => setTipMessage(e.target.value)}
                  rows={3}
                />
                <div className="label justify-end">
                  <span className="label-text-alt text-gray-400">{tipMessage.length}/140 characters</span>
                </div>
              </div>

              {/* Send Tip Button */}
              <button
                className={`btn btn-lg w-full rounded-2xl shadow-xl transition-all duration-300 font-bold ${
                  !isValidAmount || isMining
                    ? "btn-disabled bg-base-300"
                    : "btn-primary hover:scale-[1.02] hover:shadow-2xl"
                }`}
                onClick={handleTip}
                disabled={!isValidAmount || isMining}
              >
                {isMining ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Mining Transaction...
                  </>
                ) : (
                  `Send ${tipAmount || "0"} ${balance?.symbol || "MATIC"} Tip 🚀`
                )}
              </button>

              <div className="text-center text-xs text-gray-400 mt-6 space-y-1">
                <p>⚡ Transactions execute securely via smart contracts.</p>
                <p>🔒 100% Peer-to-Peer • Instant Wallet-to-Wallet settle.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
