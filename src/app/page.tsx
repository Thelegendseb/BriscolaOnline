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

const EmojiButtonBar = styled.div`
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

const EmojiButton = styled.button<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background-color: #fff;
  color: #FF7F56;
  font-size: 2rem;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  box-shadow: 0px 0.4rem 0px rgba(0, 0, 0, 0.25);
  border: none;
  opacity: ${props => props.$disabled ? 0.5 : 1};

  &:hover {
    transform: ${props => props.$disabled ? 'none' : 'translateY(-2px)'};
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

const EmojiDisplay = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  font-size: 6rem;
  position: absolute;
`;

const Card = styled.span<{ $transform?: string }>`
  background: #fff;
  border: 2px solid #000000;
  border-radius: 1rem;
  padding: 3rem 2rem;
  animation: ${slideUp} 2s linear;
  transform: ${props => props.$transform || 'none'};
  position: relative;
`;

const Avatar = styled.span`
  img {
    width: 2.5rem;
    position: absolute;
    top: 3px;
    left: 3px;
  }
`;

const randomNumBetween = (min: number, max: number) => 
  Math.floor(Math.random() * (max - min + 1) + min);

const randomRotations = Array(20).fill(0).map(() => 
  `rotate(${randomNumBetween(-5,5)}deg) translateX(${randomNumBetween(-10,10)}px)`
);

interface EmojiData {
  emoji: string;
  id: string;
}

const GameApp = () => {
  const players = usePlayersList();
  const [currentEmoji, setCurrentEmoji] = useMultiplayerState<EmojiData[]>("emoji", []);
  const [currentTurn, setCurrentTurn] = useMultiplayerState("currentTurn", 0);
  
  const isMyTurn = players.findIndex(p => p.id === myPlayer()?.id) === currentTurn;
  
  const handleEmojiClick = (emoji: string) => {
    if (!isMyTurn || !myPlayer()) return;
    
    setCurrentEmoji([...currentEmoji, { emoji, id: myPlayer()!.id }]);
    setCurrentTurn((currentTurn + 1) % players.length);
  };

  const playerColor = myPlayer()?.getProfile()?.color?.hexString || '#8D6BED';

  return (
    <AppContainer $backgroundColor={playerColor}>
      <GlobalStyle />
      {currentEmoji.map((emojiData, i) => {
        const player = players.find(p => p.id === emojiData.id);
        if (!player) return null;
        
        return (
          <EmojiDisplay key={i}>
            <Card $transform={randomRotations[i % randomRotations.length]}>
              <Avatar>
                <img src={player.getProfile().photo} alt="Player avatar" />
              </Avatar>
              {emojiData.emoji}
            </Card>
          </EmojiDisplay>
        );
      })}
      
      <EmojiButtonBar>
        <EmojiButton 
          $disabled={!isMyTurn}
          onClick={() => handleEmojiClick("🫶")}
        >
          <span role="img">🫶</span>
        </EmojiButton>
        <EmojiButton 
          $disabled={!isMyTurn}
          onClick={() => handleEmojiClick("🥳")}
        >
          <span role="img">🥳</span>
        </EmojiButton>
        <EmojiButton 
          $disabled={!isMyTurn}
          onClick={() => handleEmojiClick("👋")}
        >
          <span role="img">👋</span>
        </EmojiButton>
      </EmojiButtonBar>
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