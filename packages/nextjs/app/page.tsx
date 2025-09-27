"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { MetaHeader } from "~~/components/MetaHeader";

const Home: NextPage = () => {
  return (
    <>
      <MetaHeader />
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-6xl font-bold">TipJar</span>
            <span className="block text-2xl mb-2">Simple crypto tipping with ENS</span>
          </h1>

          <div className="flex justify-center items-center space-y-2 flex-col sm:flex-row sm:space-y-0 sm:space-x-4">
            <p className="my-2 font-medium text-lg">Get started by choosing your role:</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mt-8">
            {/* Creator Card */}
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl shadow-lg hover:shadow-xl transition-shadow">
              <span className="text-6xl mb-4">🎨</span>
              <h2 className="text-2xl font-bold mb-4">For Creators</h2>
              <p className="text-gray-600 mb-6">
                Register your ENS name and start receiving tips from your fans instantly
              </p>
              <Link href="/tip/creator" className="btn btn-primary btn-lg w-full">
                Register as Creator
              </Link>
            </div>

            {/* Fan Card */}
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl shadow-lg hover:shadow-xl transition-shadow">
              <span className="text-6xl mb-4">❤️</span>
              <h2 className="text-2xl font-bold mb-4">For Fans</h2>
              <p className="text-gray-600 mb-6">
                Support your favorite creators by sending tips directly to their wallet
              </p>
              <div className="w-full">
                <p className="text-sm text-gray-500 mb-3">Have a tip link? Click it to get started!</p>
                <p className="text-xs text-gray-400">
                  Links look like: tipjar.app/tip/creator.eth
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center mt-16 px-4">
            <h3 className="text-3xl font-bold mb-8">How it works</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
              {/* Creator Flow */}
              <div className="bg-base-100 p-6 rounded-2xl shadow-md">
                <h4 className="text-xl font-bold mb-4 flex items-center">
                  <span className="text-2xl mr-2">🎨</span>
                  Creator Journey
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start">
                    <span className="bg-primary text-primary-content rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 text-xs font-bold">1</span>
                    <span>Connect your MetaMask wallet</span>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-primary text-primary-content rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 text-xs font-bold">2</span>
                    <span>Register your ENS name</span>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-primary text-primary-content rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 text-xs font-bold">3</span>
                    <span>Share your unique tip link with fans</span>
                  </div>
                </div>
              </div>

              {/* Fan Flow */}
              <div className="bg-base-100 p-6 rounded-2xl shadow-md">
                <h4 className="text-xl font-bold mb-4 flex items-center">
                  <span className="text-2xl mr-2">❤️</span>
                  Fan Journey
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start">
                    <span className="bg-secondary text-secondary-content rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 text-xs font-bold">1</span>
                    <span>Click creator's tip link</span>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-secondary text-secondary-content rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 text-xs font-bold">2</span>
                    <span>Connect MetaMask (auto-switch to Polygon)</span>
                  </div>
                  <div className="flex items-start">
                    <span className="bg-secondary text-secondary-content rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 text-xs font-bold">3</span>
                    <span>Enter tip amount and send instantly</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center max-w-2xl">
              <p className="text-lg text-gray-600">
                Built on Polygon for fast, cheap transactions. Tips are sent directly to creators with no fees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;