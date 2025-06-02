import React, { useState } from 'react';
import styled from 'styled-components';

// ===== TYPE DEFINITIONS =====
export enum Suit {
  CLUB = 'club',
  COIN = 'coin',
  CUP = 'cup',
  SWORD = 'sword'
}

export enum CardValue {
  ONE = '1',
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  JACK = 'jack',
  KNIGHT = 'knight',
  KING = 'king'
}

// Briscola value order: 1, 3, King, Knight, Jack, 7, 6, 5, 4, 2
export const BRISCOLA_VALUE_ORDER: CardValue[] = [
  CardValue.ONE,
  CardValue.THREE,
  CardValue.KING,
  CardValue.KNIGHT,
  CardValue.JACK,
  CardValue.SEVEN,
  CardValue.SIX,
  CardValue.FIVE,
  CardValue.FOUR,
  CardValue.TWO
];

export interface Card {
  suit: Suit;
  value: CardValue;
  score: number;
  name: string;
  imagePath: string;
  id: string;
}

// ===== CONSTANTS =====
export const CARD_SCORES: Record<CardValue, number> = {
  [CardValue.ONE]: 11,
  [CardValue.TWO]: 0,
  [CardValue.THREE]: 10,
  [CardValue.FOUR]: 0,
  [CardValue.FIVE]: 0,
  [CardValue.SIX]: 0,
  [CardValue.SEVEN]: 0,
  [CardValue.JACK]: 2,
  [CardValue.KNIGHT]: 3,
  [CardValue.KING]: 4
};

export const CARD_NAMES: Record<CardValue, string> = {
  [CardValue.ONE]: 'Ace',
  [CardValue.TWO]: 'Two',
  [CardValue.THREE]: 'Three',
  [CardValue.FOUR]: 'Four',
  [CardValue.FIVE]: 'Five',
  [CardValue.SIX]: 'Six',
  [CardValue.SEVEN]: 'Seven',
  [CardValue.JACK]: 'Jack',
  [CardValue.KNIGHT]: 'Knight',
  [CardValue.KING]: 'King'
};

// ===== UTILITY FUNCTIONS =====
export const createDeck = (): Card[] => {
  return Object.values(Suit).flatMap(suit =>
    Object.values(CardValue).map(value => ({
      suit,
      value,
      score: CARD_SCORES[value],
      name: `${CARD_NAMES[value]} of ${suit}s`,
      imagePath: `/assets/cards/${suit}/${suit}_${value}.png`,
      id: `${suit}_${value}`
    }))
  );
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ===== COMPONENT =====
interface CardComponentProps {
  card: Card | null;
  disabled?: boolean;
  onClick?: () => void;
  showAvatar?: boolean;
  avatarSrc?: string;
  transform?: string;
  isBack?: boolean;
  size?: 'normal' | 'small' | 'tiny';
  colors: {
    cardBg: string;
    cardBorder: string;
    primary: string;
    secondary: string;
    text: string;
    textSecondary: string;
    surface: string;
  };
  mobileBreakpoint?: string;
}

export const CardComponent: React.FC<CardComponentProps> = ({ 
  card, 
  disabled = false, 
  onClick, 
  showAvatar = false, 
  avatarSrc, 
  transform,
  isBack = false,
  size = 'normal',
  colors,
  mobileBreakpoint = '768px'
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <CardWrapper 
      $disabled={disabled} 
      $transform={transform}
      onClick={disabled ? undefined : onClick}
      $isButton={!!onClick}
      $size={size}
      $colors={colors}
      $mobileBreakpoint={mobileBreakpoint}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {showAvatar && avatarSrc && (
        <CardAvatar $mobileBreakpoint={mobileBreakpoint} $size={size}>
          <img src={avatarSrc} alt="Player avatar" />
        </CardAvatar>
      )}
      {isBack ? (
        <CardBack $colors={colors} $size={size}>BRISCOLA</CardBack>
      ) : card ? (
        <>
          <CardImage src={card.imagePath} alt={card.name} />
          {showTooltip && !isBack && card && (
            <Tooltip $colors={colors} $size={size} $mobileBreakpoint={mobileBreakpoint}>
              <TooltipTitle>{card.name}</TooltipTitle>
              <TooltipScore>Score: {card.score} points</TooltipScore>
              <TooltipSuit>Suit: {card.suit.charAt(0).toUpperCase() + card.suit.slice(1)}s</TooltipSuit>
            </Tooltip>
          )}
        </>
      ) : (
        <CardPlaceholder $colors={colors} $size={size}>No Card</CardPlaceholder>
      )}
    </CardWrapper>
  );
};

// ===== STYLED COMPONENTS =====
const CardWrapper = styled.div<{ 
  $disabled?: boolean; 
  $transform?: string; 
  $isButton?: boolean;
  $size: 'normal' | 'small' | 'tiny';
  $colors: CardComponentProps['colors'];
  $mobileBreakpoint: string;
}>`
  background: ${props => props.$colors.cardBg};
  border: 3px solid ${props => props.$colors.cardBorder};
  border-radius: ${props => props.$isButton ? '0.8rem' : '1.2rem'};
  padding: ${props => props.$isButton ? '0.5rem' : '1rem'};
  position: relative;
  width: ${props => {
    if (props.$size === 'tiny') return props.$isButton ? '3rem' : '3.5rem';
    if (props.$size === 'small') return props.$isButton ? '4rem' : '5rem';
    return props.$isButton ? '5rem' : '8rem';
  }};
  height: ${props => {
    if (props.$size === 'tiny') return props.$isButton ? '4rem' : '4.5rem';
    if (props.$size === 'small') return props.$isButton ? '5.5rem' : '7rem';
    return props.$isButton ? '7rem' : '12rem';
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.$disabled ? 'not-allowed' : props.$isButton ? 'pointer' : 'default'};
  opacity: ${props => props.$disabled ? 0.5 : 1};
  transform: ${props => props.$transform || 'none'};
  box-shadow: ${props => props.$isButton ? '0px 0.4rem 0px rgba(0, 0, 0, 0.25)' : 'none'};
  transition: all 0.2s ease;

  &:hover {
    transform: ${props => 
      props.$disabled ? props.$transform || 'none' : 
      props.$isButton ? `${props.$transform || ''} translateY(-2px)`.trim() : 
      `${props.$transform || ''} translateY(-3px)`.trim()
    };
  }

  @media (max-width: ${props => props.$mobileBreakpoint}) {
    width: ${props => {
      if (props.$size === 'tiny') return props.$isButton ? '2.5rem' : '3rem';
      if (props.$size === 'small') return props.$isButton ? '3rem' : '4rem';
      return props.$isButton ? '4rem' : '6rem';
    }};
    height: ${props => {
      if (props.$size === 'tiny') return props.$isButton ? '3.5rem' : '4rem';
      if (props.$size === 'small') return props.$isButton ? '4.5rem' : '5.5rem';
      return props.$isButton ? '5.5rem' : '9rem';
    }};
    padding: ${props => props.$isButton ? '0.3rem' : '0.8rem'};
  }
`;

const CardImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 0.4rem;
`;

const CardBack = styled.div<{ $colors: CardComponentProps['colors']; $size: 'normal' | 'small' | 'tiny' }>`
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, ${props => props.$colors.primary}, ${props => props.$colors.secondary});
  border-radius: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$colors.text};
  font-weight: bold;
  font-size: ${props => {
    if (props.$size === 'tiny') return '0.4rem';
    if (props.$size === 'small') return '0.6rem';
    return '0.8rem';
  }};
`;

const CardPlaceholder = styled.div<{ $colors: CardComponentProps['colors']; $size: 'normal' | 'small' | 'tiny' }>`
  width: 100%;
  height: 100%;
  background: ${props => props.$colors.surface};
  border-radius: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$colors.textSecondary};
  font-size: ${props => {
    if (props.$size === 'tiny') return '0.4rem';
    if (props.$size === 'small') return '0.6rem';
    return '0.8rem';
  }};
`;

const CardAvatar = styled.div<{ $mobileBreakpoint: string; $size: 'normal' | 'small' | 'tiny' }>`
  position: absolute;
  top: 3px;
  left: 3px;
  z-index: 10;
  
  img {
    width: ${props => {
      if (props.$size === 'tiny') return '1rem';
      if (props.$size === 'small') return '1.5rem';
      return '2.5rem';
    }};
    height: ${props => {
      if (props.$size === 'tiny') return '1rem';
      if (props.$size === 'small') return '1.5rem';
      return '2.5rem';
    }};
    border-radius: 50%;
    object-fit: cover;

    @media (max-width: ${props => props.$mobileBreakpoint}) {
      width: ${props => {
        if (props.$size === 'tiny') return '0.8rem';
        if (props.$size === 'small') return '1.2rem';
        return '2rem';
      }};
      height: ${props => {
        if (props.$size === 'tiny') return '0.8rem';
        if (props.$size === 'small') return '1.2rem';
        return '2rem';
      }};
    }
  }
`;

const Tooltip = styled.div<{ $colors: CardComponentProps['colors']; $size: 'normal' | 'small' | 'tiny'; $mobileBreakpoint: string }>`
  position: absolute;
  top: ${props => {
    if (props.$size === 'tiny') return '-50px';
    if (props.$size === 'small') return '-60px';
    return '-70px';
  }};
  left: 50%;
  transform: translateX(-50%);
  background: ${props => props.$colors.surface};
  color: ${props => props.$colors.text};
  padding: ${props => {
    if (props.$size === 'tiny') return '0.25rem 0.5rem';
    if (props.$size === 'small') return '0.5rem 0.75rem';
    return '0.75rem 1rem';
  }};
  border-radius: 0.5rem;
  font-size: ${props => {
    if (props.$size === 'tiny') return '0.6rem';
    if (props.$size === 'small') return '0.7rem';
    return '0.8rem';
  }};
  white-space: nowrap;
  z-index: 1000;
  border: 2px solid ${props => props.$colors.primary};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  opacity: 0;
  animation: fadeIn 0.2s ease forwards;
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: ${props => props.$colors.surface};
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-5px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  @media (max-width: ${props => props.$mobileBreakpoint}) {
    display: none; /* Hide tooltips on mobile to avoid touch issues */
  }
`;

const TooltipTitle = styled.div`
  font-weight: bold;
  margin-bottom: 0.25rem;
`;

const TooltipScore = styled.div`
  color: #FFD700;
  font-weight: 600;
  margin-bottom: 0.1rem;
`;

const TooltipSuit = styled.div`
  color: #87CEEB;
  font-size: 0.9em;
`;