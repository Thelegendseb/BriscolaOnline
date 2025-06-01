"use client";

import { useEffect, useState } from "react";
import styled, { keyframes, createGlobalStyle } from "styled-components";
import { 
  useMultiplayerState,
  insertCoin, 
  myPlayer,
  usePlayersList 
} from "playroomkit";

const GlobalStyle = createGlobalStyle`
  body {
    background-color: #8D6BED;
    color: #fff;
    margin: 0;
    overflow: hidden;
    user-select: none;
  }
`;

const AppContainer = styled.div<{ $backgroundColor?: string }>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: ${props => props.$backgroundColor || '#8D6BED'};
`;

const CardButtonBar = styled.div`
  display: flex;
  position: fixed;
  bottom: 0;
  align-items: center;
  left: 0;
  right: 0;
  justify-content: center;
  gap: 1rem;
  padding: 1rem 0px;
`;

const CardButton = styled.button<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 7rem;
  border-radius: 0.8rem;
  background-color: #fff;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  box-shadow: 0px 0.4rem 0px rgba(0, 0, 0, 0.25);
  border: 2px solid #333;
  opacity: ${props => props.$disabled ? 0.5 : 1};
  padding: 0.5rem;

  &:hover {
    transform: ${props => props.$disabled ? 'none' : 'translateY(-2px)'};
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 0.4rem;
  }
`;

const slideUp = keyframes`
  0% {
    opacity: 1;
    margin-top: 200vh;
    animation-timing-function: ease-out;
  }
  15% {
    margin-top: -10vh;
    animation-timing-function: ease-in;
  }
  18% {
    margin-top: 5vh;
    animation-timing-function: ease-out;
  }
  20% {
    margin-top: 0px;
    animation-timing-function: ease-in;
  }
  95% {
    opacity: 1;
    margin-top: 0px;
    animation-timing-function: ease-in;
  }
  100% {
    margin-top: 0px;
    opacity: 1;
    animation-timing-function: ease-out;
  }
`;

const CardDisplay = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  position: absolute;
`;

const PlayedCard = styled.div<{ $transform?: string }>`
  background: #fff;
  border: 3px solid #333;
  border-radius: 1.2rem;
  padding: 1rem;
  animation: ${slideUp} 2s linear;
  transform: ${props => props.$transform || 'none'};
  position: relative;
  width: 8rem;
  height: 12rem;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 0.6rem;
  }
`;

const Avatar = styled.span`
  img {
    width: 2.5rem;
    position: absolute;
    top: 3px;
    left: 3px;
    border-radius: 50%;
  }
`;

const randomNumBetween = (min: number, max: number) => 
  Math.floor(Math.random() * (max - min + 1) + min);

const randomRotations = Array(20).fill(0).map(() => 
  `rotate(${randomNumBetween(-5,5)}deg) translateX(${randomNumBetween(-10,10)}px)`
);

interface CardData {
  cardPath: string;
  id: string;
}

const suits = ['club', 'coin', 'cup', 'sword'];
const values = ['1', '2', '3', '4', '5', '6', '7', 'jack', 'knight', 'king'];

const getRandomCard = () => {
  const suit = suits[randomNumBetween(0, suits.length - 1)];
  const value = values[randomNumBetween(0, values.length - 1)];
  return `/assets/cards/${suit}/${suit}_${value}.png`;
};

const GameApp = () => {
  const players = usePlayersList();
  const [playedCards, setPlayedCards] = useMultiplayerState<CardData[]>("playedCards", []);
  const [currentTurn, setCurrentTurn] = useMultiplayerState("currentTurn", 0);
  
  const isMyTurn = players.findIndex(p => p.id === myPlayer()?.id) === currentTurn;
  
  const handleCardPlay = () => {
    if (!isMyTurn || !myPlayer()) return;
    
    const randomCard = getRandomCard();
    setPlayedCards([...playedCards, { cardPath: randomCard, id: myPlayer()!.id }]);
    setCurrentTurn((currentTurn + 1) % players.length);
  };

  const playerColor = myPlayer()?.getProfile()?.color?.hexString || '#8D6BED';

  return (
    <AppContainer $backgroundColor={playerColor}>
      <GlobalStyle />
      {playedCards.map((cardData, i) => {
        const player = players.find(p => p.id === cardData.id);
        if (!player) return null;
        
        return (
          <CardDisplay key={i}>
            <PlayedCard $transform={randomRotations[i % randomRotations.length]}>
              <Avatar>
                <img src={player.getProfile().photo} alt="Player avatar" />
              </Avatar>
              <img src={cardData.cardPath} alt="Playing card" />
            </PlayedCard>
          </CardDisplay>
        );
      })}
      
      <CardButtonBar>
        <CardButton 
          $disabled={!isMyTurn}
          onClick={handleCardPlay}
        >
          <img src={getRandomCard()} alt="Card to play" />
        </CardButton>
        <CardButton 
          $disabled={!isMyTurn}
          onClick={handleCardPlay}
        >
          <img src={getRandomCard()} alt="Card to play" />
        </CardButton>
        <CardButton 
          $disabled={!isMyTurn}
          onClick={handleCardPlay}
        >
          <img src={getRandomCard()} alt="Card to play" />
        </CardButton>
      </CardButtonBar>
    </AppContainer>
  );
};

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);

  useEffect(() => {
    // Set temporary storage for development (matching the example)
    if (typeof window !== 'undefined') {
      (window as any)._USETEMPSTORAGE = true;
    }
    
    insertCoin().then(() => {
      setGameStarted(true);
    });
  }, []);

  if (!gameStarted) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#8D6BED',
        color: '#fff'
      }}>
        Loading...
      </div>
    );
  }

  return <GameApp />;
}