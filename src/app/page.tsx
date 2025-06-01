"use client";

import { useEffect, useState, useCallback } from "react";
import styled, { keyframes, createGlobalStyle } from "styled-components";
import { 
  useMultiplayerState,
  insertCoin, 
  myPlayer,
  usePlayersList,
  PlayerState,
  onPlayerJoin,
  setState,
  getState,
  isHost
} from "playroomkit";

// ===== COLOR THEME =====
const COLORS = {
  primary: '#2C5F41',      // Deep green
  secondary: '#4A7A5C',    // Medium green
  accent: '#FFD700',       // Gold
  background: '#1A3A2E',   // Dark green
  surface: '#3E6B5A',      // Light green
  text: '#FFFFFF',         // White
  textSecondary: '#E8F5E8', // Light green text
  error: '#FF6B6B',        // Red
  success: '#51CF66',      // Light green
  cardBg: '#FFFFFF',       // White for cards
  cardBorder: '#2C3E50',   // Dark border for cards
  glassBg: 'rgba(255, 255, 255, 0.1)', // Glass effect
} as const;

// ===== TYPE DEFINITIONS =====
enum Suit {
  CLUB = 'club',
  COIN = 'coin',
  CUP = 'cup',
  SWORD = 'sword'
}

enum CardValue {
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
const BRISCOLA_VALUE_ORDER: CardValue[] = [
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

interface Card {
  suit: Suit;
  value: CardValue;
  score: number;
  name: string;
  imagePath: string;
  id: string; // Unique identifier
}

interface PlayedCardData {
  card: Card;
  playerId: string;
  transform: string;
}

interface PlayerInfo {
  id: string;
  username: string;
  avatar: string;
  color: string;
}

interface NotificationState {
  message: string;
  visible: boolean;
  timestamp: number;
}

interface GameState {
  deck: Card[];
  trumpCard: Card | null;
  gameStarted: boolean;
  isShuffling: boolean;
}

// ===== CONSTANTS =====
const CARD_SCORES: Record<CardValue, number> = {
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

const CARD_NAMES: Record<CardValue, string> = {
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

const createDeck = (): Card[] => {
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

const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const MOBILE_BREAKPOINT = '768px';

// ===== UTILITY FUNCTIONS =====
const randomNumBetween = (min: number, max: number): number => 
  Math.floor(Math.random() * (max - min + 1) + min);

const generateRandomTransform = (): string =>
  `rotate(${randomNumBetween(-5, 5)}deg) translateX(${randomNumBetween(-10, 10)}px)`;

const extractPlayerInfo = (player: PlayerState): PlayerInfo => ({
  id: player.id,
  username: player.getProfile()?.name || 'Unknown',
  avatar: player.getProfile()?.photo || '',
  color: player.getProfile()?.color?.hexString || COLORS.accent
});

const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// ===== COMPONENTS =====
interface PlayerListProps {
  players: PlayerState[];
  currentTurnIndex: number;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, currentTurnIndex }) => (
  <PlayerListContainer>
    <PlayerListTitle>Players ({players.length})</PlayerListTitle>
    {players.map((player, index) => {
      const playerInfo = extractPlayerInfo(player);
      const isCurrentTurn = index === currentTurnIndex;
      
      return (
        <PlayerItem key={playerInfo.id} $isCurrentTurn={isCurrentTurn}>
          <PlayerAvatar src={playerInfo.avatar} alt={playerInfo.username} />
          <PlayerName>{playerInfo.username}</PlayerName>
          {isCurrentTurn && <TurnIndicator>●</TurnIndicator>}
        </PlayerItem>
      );
    })}
  </PlayerListContainer>
);

interface NotificationProps {
  notification: NotificationState;
}

const Notification: React.FC<NotificationProps> = ({ notification }) => (
  <NotificationContainer $visible={notification.visible}>
    {notification.message}
  </NotificationContainer>
);

interface CardComponentProps {
  card: Card | null;
  disabled?: boolean;
  onClick?: () => void;
  showAvatar?: boolean;
  avatarSrc?: string;
  transform?: string;
  isBack?: boolean;
}

const CardComponent: React.FC<CardComponentProps> = ({ 
  card, 
  disabled = false, 
  onClick, 
  showAvatar = false, 
  avatarSrc, 
  transform,
  isBack = false
}) => (
  <CardWrapper 
    $disabled={disabled} 
    $transform={transform}
    onClick={disabled ? undefined : onClick}
    $isButton={!!onClick}
  >
    {showAvatar && avatarSrc && (
      <CardAvatar>
        <img src={avatarSrc} alt="Player avatar" />
      </CardAvatar>
    )}
    {isBack ? (
      <CardBack>BRISCOLA</CardBack>
    ) : card ? (
      <CardImage src={card.imagePath} alt={card.name} />
    ) : (
      <CardPlaceholder>No Card</CardPlaceholder>
    )}
  </CardWrapper>
);

interface TrumpDisplayProps {
  trumpCard: Card | null;
  deckCount: number;
}

const TrumpDisplay: React.FC<TrumpDisplayProps> = ({ trumpCard, deckCount }) => (
  <TrumpContainer>
    <TrumpTitle>Trump Card</TrumpTitle>
    <TrumpCardArea>
      <DeckIndicator>
        <CardComponent card={null} isBack={true} />
        <DeckCount>{deckCount} cards</DeckCount>
      </DeckIndicator>
      {trumpCard && (
        <CardComponent card={trumpCard} />
      )}
    </TrumpCardArea>
    {trumpCard && (
      <TrumpInfo>
        <div>{trumpCard.name}</div>
        <div>Trump Suit: {trumpCard.suit.charAt(0).toUpperCase() + trumpCard.suit.slice(1)}s</div>
      </TrumpInfo>
    )}
  </TrumpContainer>
);

// ===== MAIN GAME COMPONENT =====
const GameApp: React.FC = () => {
  const players = usePlayersList();
  const [playedCards, setPlayedCards] = useMultiplayerState<PlayedCardData[]>("playedCards", []);
  const [currentTurn, setCurrentTurn] = useMultiplayerState<number>("currentTurn", 0);
  const [gameState, setGameState] = useMultiplayerState<GameState>("gameState", {
    deck: [],
    trumpCard: null,
    gameStarted: false,
    isShuffling: false
  });
  
  const [notification, setNotification] = useState<NotificationState>({
    message: '',
    visible: false,
    timestamp: 0
  });

  const currentPlayer = myPlayer();
  const currentPlayerIndex = players.findIndex(p => p.id === currentPlayer?.id);
  const isMyTurn = currentPlayerIndex === currentTurn;
  const isGameHost = isHost();

  const showNotification = useCallback((message: string) => {
    setNotification({
      message,
      visible: true,
      timestamp: Date.now()
    });
    
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  const initializeGame = useCallback(async () => {
  if (!isGameHost || gameState.gameStarted) return;

  showNotification("Host is shuffling the deck...");
  setGameState({ ...gameState, isShuffling: true });

  // Simulate shuffling delay
  await sleep(2000);

  const newDeck = shuffleDeck(createDeck());
  const trumpCard = newDeck.pop()!; // Remove trump card from deck

  setGameState({
    deck: newDeck,
    trumpCard,
    gameStarted: true,
    isShuffling: false
  });

  showNotification(`Game started! Trump suit: ${trumpCard.suit}s`);
}, [isGameHost, gameState, setGameState, showNotification]);

  const handleCardPlay = useCallback((card: Card) => {
    if (!isMyTurn || !currentPlayer || !gameState.gameStarted) {
      showNotification("It's not your turn or game hasn't started!");
      return;
    }
    
    const newPlayedCard: PlayedCardData = {
      card,
      playerId: currentPlayer.id,
      transform: generateRandomTransform()
    };
    
    setPlayedCards([...playedCards, newPlayedCard]);
    setCurrentTurn((currentTurn + 1) % players.length);
    showNotification(`You played ${card.name}`);
  }, [isMyTurn, currentPlayer, gameState.gameStarted, playedCards, currentTurn, players.length, setPlayedCards, setCurrentTurn, showNotification]);

  // Initialize game when host and players are ready
  useEffect(() => {
    if (isGameHost && players.length >= 2 && !gameState.gameStarted && !gameState.isShuffling) {
      const timer = setTimeout(() => {
        initializeGame();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isGameHost, players.length, gameState.gameStarted, gameState.isShuffling, initializeGame]);

  // Handle player joining
  useEffect(() => {
    const unsubscribe = onPlayerJoin((playerState) => {
      const playerInfo = extractPlayerInfo(playerState);
      showNotification(`${playerInfo.username} joined the game!`);
      
      playerState.onQuit(() => {
        showNotification(`${playerInfo.username} left the game!`);
      });
    });

    return unsubscribe;
  }, [showNotification]);

  // Mock player hand for demonstration
  const playerHand = gameState.gameStarted ? [
    createDeck()[0], createDeck()[1], createDeck()[2]
  ] : [];

  return (
    <GameContainer>
      <GlobalStyle />
      
      <PlayerList players={players} currentTurnIndex={currentTurn} />
      
      <Notification notification={notification} />
      
      <TrumpDisplay trumpCard={gameState.trumpCard} deckCount={gameState.deck.length} />
      
      <PlayAreaContainer>
        {gameState.isShuffling && (
          <ShufflingIndicator>
            <ShufflingText>Shuffling...</ShufflingText>
          </ShufflingIndicator>
        )}
        
        {playedCards.map((playedCard, index) => {
          const player = players.find(p => p.id === playedCard.playerId);
          const playerInfo = player ? extractPlayerInfo(player) : null;
          
          return (
            <PlayedCardContainer key={`${playedCard.playerId}-${index}`}>
              <CardComponent
                card={playedCard.card}
                showAvatar={true}
                avatarSrc={playerInfo?.avatar}
                transform={playedCard.transform}
              />
            </PlayedCardContainer>
          );
        })}
      </PlayAreaContainer>
      
      <HandContainer>
        {!gameState.gameStarted ? (
          <WaitingMessage>
            {isGameHost ? 
              `Waiting for players... (${players.length}/4)` : 
              "Waiting for host to start the game..."
            }
          </WaitingMessage>
        ) : (
          playerHand.map((card, index) => (
            <CardComponent
              key={card.id}
              card={card}
              disabled={!isMyTurn}
              onClick={() => handleCardPlay(card)}
            />
          ))
        )}
      </HandContainer>
    </GameContainer>
  );
};

// ===== MAIN COMPONENT =====
export default function Home() {
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any)._USETEMPSTORAGE = true;
    }
    
    insertCoin().then(() => {
      setGameStarted(true);
    });
  }, []);

  if (!gameStarted) {
    return <LoadingScreen>Loading...</LoadingScreen>;
  }

  return <GameApp />;
}

// ===== ANIMATIONS =====
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

const fadeInOut = keyframes`
  0% { opacity: 0; transform: translateY(-20px); }
  10% { opacity: 1; transform: translateY(0); }
  90% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-20px); }
`;

const shuffle = keyframes`
  0% { transform: rotate(0deg) scale(1); }
  25% { transform: rotate(5deg) scale(1.1); }
  50% { transform: rotate(-5deg) scale(0.9); }
  75% { transform: rotate(3deg) scale(1.1); }
  100% { transform: rotate(0deg) scale(1); }
`;

// ===== STYLED COMPONENTS =====
const GlobalStyle = createGlobalStyle`
  body {
    background-color: ${COLORS.background};
    color: ${COLORS.text};
    margin: 0;
    overflow: hidden;
    user-select: none;
    font-family: 'Arial', sans-serif;
  }
`;

const GameContainer = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: ${COLORS.background};
  display: grid;
  grid-template-areas: 
    "players notification trump"
    "players play-area trump"
    "players hand trump";
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  gap: 1rem;
  padding: 1rem;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    grid-template-areas: 
      "notification"
      "trump"
      "play-area"
      "hand"
      "players";
    grid-template-columns: 1fr;
    grid-template-rows: auto auto 1fr auto auto;
    padding: 0.5rem;
  }
`;

const LoadingScreen = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: ${COLORS.background};
  color: ${COLORS.text};
  font-size: 1.5rem;
`;

const PlayerListContainer = styled.div`
  grid-area: players;
  background-color: ${COLORS.glassBg};
  border-radius: 1rem;
  padding: 1rem;
  backdrop-filter: blur(10px);
  border: 1px solid ${COLORS.surface};

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    max-height: 150px;
    overflow-y: auto;
  }
`;

const PlayerListTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  text-align: center;
  color: ${COLORS.textSecondary};
`;

const PlayerItem = styled.div<{ $isCurrentTurn: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  background-color: ${props => props.$isCurrentTurn ? COLORS.surface : 'transparent'};
  border: ${props => props.$isCurrentTurn ? `2px solid ${COLORS.accent}` : '2px solid transparent'};
`;

const PlayerAvatar = styled.img`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  object-fit: cover;
`;

const PlayerName = styled.span`
  flex: 1;
  font-weight: 500;
`;

const TurnIndicator = styled.span`
  color: ${COLORS.accent};
  font-size: 1.2rem;
`;

const NotificationContainer = styled.div<{ $visible: boolean }>`
  grid-area: notification;
  display: ${props => props.$visible ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  background-color: ${COLORS.surface};
  color: ${COLORS.text};
  padding: 1rem 2rem;
  border-radius: 0.5rem;
  animation: ${props => props.$visible ? fadeInOut : 'none'} 3s ease-in-out;
  z-index: 1000;
  margin: 0 auto;
  max-width: 400px;
  border: 1px solid ${COLORS.accent};
`;

const TrumpContainer = styled.div`
  grid-area: trump;
  background-color: ${COLORS.glassBg};
  border-radius: 1rem;
  padding: 1rem;
  backdrop-filter: blur(10px);
  border: 1px solid ${COLORS.surface};
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const TrumpTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  color: ${COLORS.textSecondary};
`;

const TrumpCardArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const DeckIndicator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
`;

const DeckCount = styled.span`
  font-size: 0.9rem;
  color: ${COLORS.textSecondary};
`;

const TrumpInfo = styled.div`
  margin-top: 1rem;
  font-weight: bold;
  color: ${COLORS.accent};
  text-align: center;
  line-height: 1.4;
  
  div:first-child {
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }
  
  div:last-child {
    font-size: 0.9rem;
    color: ${COLORS.textSecondary};
  }
`;

const PlayAreaContainer = styled.div`
  grid-area: play-area;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-height: 200px;
  background-color: ${COLORS.glassBg};
  border-radius: 1rem;
  border: 1px solid ${COLORS.surface};
`;

const PlayedCardContainer = styled.div`
  position: absolute;
  animation: ${slideUp} 2s linear;
`;

const ShufflingIndicator = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: ${shuffle} 1s infinite;
`;

const ShufflingText = styled.span`
  font-size: 1.5rem;
  color: ${COLORS.accent};
  font-weight: bold;
`;

const HandContainer = styled.div`
  grid-area: hand;
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 1rem 0;

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    gap: 0.5rem;
    padding: 0.5rem 0;
  }
`;

const WaitingMessage = styled.div`
  color: ${COLORS.textSecondary};
  font-size: 1.2rem;
  text-align: center;
  padding: 2rem;
`;

const CardWrapper = styled.div<{ 
  $disabled?: boolean; 
  $transform?: string; 
  $isButton?: boolean;
}>`
  background: ${COLORS.cardBg};
  border: 3px solid ${COLORS.cardBorder};
  border-radius: ${props => props.$isButton ? '0.8rem' : '1.2rem'};
  padding: ${props => props.$isButton ? '0.5rem' : '1rem'};
  position: relative;
  width: ${props => props.$isButton ? '5rem' : '8rem'};
  height: ${props => props.$isButton ? '7rem' : '12rem'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.$disabled ? 'not-allowed' : props.$isButton ? 'pointer' : 'default'};
  opacity: ${props => props.$disabled ? 0.5 : 1};
  transform: ${props => props.$transform || 'none'};
  box-shadow: ${props => props.$isButton ? '0px 0.4rem 0px rgba(0, 0, 0, 0.25)' : 'none'};

  &:hover {
    transform: ${props => 
      props.$disabled ? props.$transform || 'none' : 
      props.$isButton ? `${props.$transform || ''} translateY(-2px)`.trim() : 
      props.$transform || 'none'
    };
  }

  @media (max-width: ${MOBILE_BREAKPOINT}) {
    width: ${props => props.$isButton ? '4rem' : '6rem'};
    height: ${props => props.$isButton ? '5.5rem' : '9rem'};
    padding: ${props => props.$isButton ? '0.3rem' : '0.8rem'};
  }
`;

const CardImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 0.4rem;
`;

const CardBack = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, ${COLORS.primary}, ${COLORS.secondary});
  border-radius: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${COLORS.text};
  font-weight: bold;
  font-size: 0.8rem;
`;

const CardPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  background: ${COLORS.surface};
  border-radius: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${COLORS.textSecondary};
  font-size: 0.8rem;
`;

const CardAvatar = styled.div`
  position: absolute;
  top: 3px;
  left: 3px;
  
  img {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    object-fit: cover;

    @media (max-width: ${MOBILE_BREAKPOINT}) {
      width: 2rem;
      height: 2rem;
    }
  }
`;