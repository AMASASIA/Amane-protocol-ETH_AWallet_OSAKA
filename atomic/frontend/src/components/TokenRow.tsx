import React from 'react';
import { Token } from '../types';
import { getTokenPriceUsd } from './NFTCard';

interface TokenRowProps {
  token: Token;
  onClick?: () => void;
}

export const TokenRow: React.FC<TokenRowProps> = ({ token, onClick }) => {
  const price = getTokenPriceUsd(token);
  const usdValue = token.balance * price;

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-900 hover:border-zinc-800 cursor-pointer transition-colors"
    >
      {/* Left: Token Monogram & Name */}
      <div className="flex items-center space-x-3.5">
        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-mono font-bold text-white flex-shrink-0">
          {token.symbol.slice(0, 3)}
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="text-sm font-semibold text-white">{token.name}</span>
          </div>
          <p className="text-xs text-zinc-500 font-mono">
            {token.balance.toLocaleString()} {token.symbol}
          </p>
        </div>
      </div>

      {/* Right: USD Valuation */}
      <div className="text-right">
        <p className="text-sm font-semibold text-white font-mono">
          ${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-[11px] text-zinc-500 font-mono">
          ${price.toLocaleString()}
        </p>
      </div>
    </div>
  );
};
