"use client";

import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { useAccount, useChainId } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export default function CreatorPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const [inputName, setInputName] = useState("");
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Handle hydration to prevent React discrepancies
  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Read check: Does this connected address already have a registered name?
  const {
    data: registeredName,
    isLoading: isLoadingRegisteredName,
    refetch: refetchName,
  } = useScaffoldReadContract({
    contractName: "TipJar",
    functionName: "addressToEns",
    args: [address],
  });

  const hasProfile = registeredName && registeredName.length > 0;

  // 2. Read check: Fetch full creator struct data if profile exists
  const {
    data: creatorData,
    isLoading: isLoadingCreatorData,
    refetch: refetchCreator,
  } = useScaffoldReadContract({
    contractName: "TipJar",
    functionName: "creators",
    args: [registeredName || ""],
    query: {
      enabled: !!hasProfile,
    },
  });

  // 3. Read check: Is the typed input name already taken by someone else?
  const { data: takenCheckData } = useScaffoldReadContract({
    contractName: "TipJar",
    functionName: "creators",
    args: [inputName.trim()],
    query: {
      enabled: inputName.trim().length > 0,
    },
  });

  const isNameTaken = takenCheckData ? takenCheckData[4] : false; // isRegistered field

  // 4. Write hook: Create a new creator profile on-chain
  const { writeContractAsync: registerProfile, isMining: isRegistering } = useScaffoldWriteContract({
    contractName: "TipJar",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedName = inputName.trim();

    if (!formattedName) {
      notification.error("Profile name cannot be empty");
      return;
    }

    if (isNameTaken) {
      notification.error("This name is already registered");
      return;
    }

    try {
      notification.info("Registering profile on-chain...");

      await registerProfile({
        functionName: "registerCreator",
        args: [formattedName],
      });

      notification.success("Profile created successfully! 🎉");
      setInputName("");

      // Force reload data
      refetchName();
      refetchCreator();
    } catch (err: any) {
      console.error(err);
      notification.error(err?.message || "Registration transaction failed.");
    }
  };

  const copyLink = () => {
    if (!registeredName) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const shareUrl = `${origin}/tip/${encodeURIComponent(registeredName)}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    notification.success("Sharing link copied to clipboard!");
    setTimeout(() => setCopied(false), 3000);
  };

  const getNetworkName = () => {
    if (chainId === 31337) return "Hardhat Local";
    if (chainId === 137) return "Polygon";
    return "Unknown Network";
  };

  // Don't render until mounted (hydration guard)
  if (!mounted) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-base-300 via-base-100 to-base-300">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const isDashboardLoading = isLoadingRegisteredName || (hasProfile && isLoadingCreatorData);

  return (
    <div className="flex items-center flex-col flex-grow pt-10 px-4 bg-gradient-to-br from-base-300 via-base-100 to-base-300 min-h-screen pb-16">
      <div className="w-full max-w-2xl">
        {/* Connection status banner */}
        {!isConnected && (
          <div className="bg-base-100 p-8 rounded-3xl shadow-xl border border-base-200 text-center mb-6">
            <span className="text-6xl mb-4 block">🔌</span>
            <h2 className="text-2xl font-bold mb-2">Connect Your Web3 Wallet</h2>
            <p className="text-gray-500 mb-6">
              Connect your MetaMask or preferred wallet to view your creator profile or register a new one.
            </p>
          </div>
        )}

        {isConnected && isDashboardLoading && (
          <div className="bg-base-100 p-12 rounded-3xl shadow-xl border border-base-200 text-center flex flex-col items-center justify-center">
            <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
            <p className="text-sm font-semibold">Reading Clapcoin registry from blockchain...</p>
          </div>
        )}

        {isConnected && !isDashboardLoading && (
          <>
            {/* NETWORK BANNER */}
            {chainId !== 31337 && chainId !== 137 && (
              <div className="alert alert-warning shadow-md rounded-2xl mb-6">
                <span>
                  ⚠️ Please switch your wallet to Hardhat Local or Polygon Mainnet to interact. (Current:{" "}
                  {getNetworkName()})
                </span>
              </div>
            )}

            {/* DASHBOARD MODE: User already has registered profile */}
            {hasProfile ? (
              <div className="space-y-6">
                {/* Header Profile Info */}
                <div className="bg-base-100 p-8 rounded-3xl shadow-xl border border-base-200 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-36 h-36 bg-secondary/15 rounded-full blur-2xl"></div>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="avatar placeholder">
                      <div className="bg-secondary text-secondary-content rounded-full w-20 shadow-md ring ring-secondary ring-offset-2">
                        <span className="text-3xl">👑</span>
                      </div>
                    </div>
                    <div className="text-center sm:text-left flex-1 min-w-0">
                      <span className="badge badge-secondary font-bold text-xs uppercase mb-1">Registered Creator</span>
                      <h2 className="text-3xl font-extrabold truncate text-base-content">{registeredName}</h2>
                      <p className="text-xs font-mono text-gray-500 mt-1 truncate max-w-sm p-1.5 bg-base-200/50 rounded-lg">
                        Addr: {address}
                      </p>
                    </div>
                  </div>

                  <div className="divider my-6"></div>

                  {/* Blockchain Live Statistics */}
                  <h3 className="text-lg font-bold text-gray-400 mb-3 uppercase tracking-wider text-center sm:text-left">
                    Live On-Chain Stats
                  </h3>
                  <div className="stats stats-horizontal shadow-sm bg-base-200/40 border border-base-200 w-full">
                    <div className="stat place-items-center py-4">
                      <div className="stat-title text-xs font-bold text-gray-400">Total Earnings</div>
                      <div className="stat-value text-primary text-3xl font-black">
                        {creatorData ? Number(formatEther(creatorData[2])).toFixed(4) : "0.00"}
                      </div>
                      <div className="stat-desc font-bold text-xs mt-1 text-gray-400">MATIC / ETH</div>
                    </div>
                    <div className="stat place-items-center py-4">
                      <div className="stat-title text-xs font-bold text-gray-400">Supporters</div>
                      <div className="stat-value text-secondary text-3xl font-black">
                        {creatorData ? Number(creatorData[3]) : 0}
                      </div>
                      <div className="stat-desc font-bold text-xs mt-1 text-gray-400">UNIQUE CLAPS</div>
                    </div>
                  </div>
                </div>

                {/* Share Link Card */}
                <div className="bg-base-100 p-8 rounded-3xl shadow-xl border border-base-200">
                  <h3 className="text-xl font-bold mb-2">📢 Share Your Tipping Page</h3>
                  <p className="text-gray-500 text-sm mb-4">
                    Copy and share your unique tipping link on Twitter, GitHub, or your website. Supporters can tip you
                    instantly!
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2 mt-4 bg-base-200 p-3 rounded-2xl border border-base-300">
                    <div className="font-mono text-sm break-all flex-grow py-3 px-2 text-primary font-semibold select-all">
                      {typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/tip/
                      {encodeURIComponent(registeredName)}
                    </div>
                    <button
                      onClick={copyLink}
                      className={`btn font-bold px-6 h-12 rounded-xl transition-all duration-200 shrink-0 ${
                        copied ? "btn-success text-white" : "btn-primary shadow-lg"
                      }`}
                    >
                      {copied ? "✓ Copied" : "Copy Link 🔗"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* REGISTRATION MODE: User does not have a profile yet */
              <div className="bg-base-100 p-8 md:p-10 rounded-3xl shadow-xl border border-base-200 relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl"></div>

                <div className="text-center mb-8">
                  <span className="text-6xl mb-4 block">🚀</span>
                  <h2 className="text-3xl font-black">Join as a Clapcoin Creator</h2>
                  <p className="text-gray-500 mt-2 max-w-md mx-auto">
                    Claim your unique profile name on-chain to unlock a fee-free, instant cryptocurrency tipping
                    experience for your supporters.
                  </p>
                </div>

                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="form-control w-full">
                    <label className="label">
                      <span className="label-text text-md font-semibold text-base-content/80">
                        Choose Your Unique Handle
                      </span>
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. alice, vitalik.eth"
                        className={`input input-bordered w-full h-14 rounded-2xl text-lg font-bold pr-24 ${
                          inputName.trim() && isNameTaken
                            ? "input-error bg-error/5"
                            : inputName.trim() && !isNameTaken
                              ? "input-success bg-success/5"
                              : ""
                        }`}
                        value={inputName}
                        onChange={e => setInputName(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""))}
                        disabled={isRegistering}
                        maxLength={32}
                      />
                      <span className="absolute right-4 top-4 font-bold text-gray-400 text-sm">.clap</span>
                    </div>

                    {/* Validations feedback label */}
                    {inputName.trim() && isNameTaken && (
                      <div className="label">
                        <span className="label-text-alt text-error font-medium">
                          ⚠️ This profile name is already taken.
                        </span>
                      </div>
                    )}
                    {inputName.trim() && !isNameTaken && (
                      <div className="label">
                        <span className="label-text-alt text-success font-semibold">✓ Name is available!</span>
                      </div>
                    )}
                    <label className="label">
                      <span className="label-text-alt text-gray-400">
                        Supports lowercase letters, numbers, dots, dashes, and underscores.
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className={`btn btn-lg w-full rounded-2xl shadow-xl transition-all duration-300 font-bold ${
                      !inputName.trim() || isNameTaken || isRegistering
                        ? "btn-disabled bg-base-300"
                        : "btn-primary hover:scale-[1.01] hover:shadow-2xl"
                    }`}
                    disabled={!inputName.trim() || isNameTaken || isRegistering}
                  >
                    {isRegistering ? (
                      <>
                        <span className="loading loading-spinner"></span>
                        Broadcasting Transaction...
                      </>
                    ) : (
                      "Register My Profile Name ✍️"
                    )}
                  </button>
                </form>

                <div className="divider my-8"></div>
                <div className="text-center text-xs text-gray-400 space-y-1">
                  <p>⛽ Note: Creating your handle requires a small gas transaction fee on your active network.</p>
                  <p>🔒 Once registered, your username is mapped directly to your address on the blockchain.</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
