import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';

import { theme } from '../lib/theme';
import { apiClient } from '../lib/apiClient';
import { SpeakBackComponent } from '../components/SpeakBackComponent';
import type { V2Phrase } from '../types';

type MessageType = 
  | 'coach_text'
  | 'coach_prompt'
  | 'user_response'
  | 'mcq_card'
  | 'gap_card'
  | 'translate_back_card'
  | 'speech_card'
  | 'context_card'
  | 'expand_card'
  | 'pronunciation_bubble'
  | 'continue_button'
  | 'feedback_success'
  | 'feedback_error';

interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  options?: string[];
  correctAnswer?: string;
  expectedAnswers?: string[];
  answered?: boolean;
  userAnswer?: string;
  isCorrect?: boolean;
  cardType?: 'translateBack' | 'speech' | 'context';
  phraseText?: string;
  language?: string;
  validation?: string;
}

interface CoachBubbleProps {
  content: string;
  isPrompt?: boolean;
  isFeedback?: 'success' | 'error';
}

function CoachBubble({ content, isPrompt, isFeedback }: CoachBubbleProps) {
  const getBubbleStyle = () => {
    if (isFeedback === 'success') return styles.coachBubbleSuccess;
    if (isFeedback === 'error') return styles.coachBubbleError;
    if (isPrompt) return styles.coachBubblePrompt;
    return styles.coachBubble;
  };

  return (
    <View style={styles.coachRow}>
      <View style={[styles.bubbleBase, getBubbleStyle()]}>
        <Text style={styles.coachText}>{content}</Text>
      </View>
    </View>
  );
}

interface UserBubbleProps {
  content: string;
  isCorrect?: boolean;
}

function UserBubble({ content, isCorrect }: UserBubbleProps) {
  return (
    <View style={styles.userRow}>
      <View style={[
        styles.bubbleBase, 
        styles.userBubble,
        isCorrect === true && styles.userBubbleCorrect,
        isCorrect === false && styles.userBubbleIncorrect,
      ]}>
        <Text style={styles.userText}>{content}</Text>
      </View>
    </View>
  );
}

interface PronunciationBubbleProps {
  pronunciationHint: string;
  phraseText: string;
  language: string;
}

function PronunciationBubble({ pronunciationHint, phraseText, language }: PronunciationBubbleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const getLanguageName = (lang: string): string => {
    const langMap: { [key: string]: string } = {
      'it': 'italian',
      'es': 'spanish',
      'fr': 'french',
      'de': 'german',
      'en': 'english',
      'pt': 'portuguese',
    };
    return langMap[lang.toLowerCase()] || lang;
  };

  const playPronunciation = async () => {
    if (isPlaying) return;

    setIsPlaying(true);
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const languageName = getLanguageName(language);
      const result = await apiClient.pronounceText(phraseText, languageName);
      
      if (!result.success || !result.audioBase64) {
        console.error('Pronunciation failed:', result.error);
        setIsPlaying(false);
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${result.audioBase64}` },
        { shouldPlay: true }
      );
      
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          sound.unloadAsync();
          if (soundRef.current === sound) {
            soundRef.current = null;
          }
        }
      });

      console.log('🔊 Playing TTS for:', phraseText);
    } catch (error) {
      console.error('TTS error:', error);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  return (
    <View style={styles.coachRow}>
      <TouchableOpacity 
        style={[styles.bubbleBase, styles.pronunciationBubble, isPlaying && styles.pronunciationBubblePlaying]}
        onPress={playPronunciation}
        disabled={isPlaying}
        activeOpacity={0.7}
      >
        <View style={styles.pronunciationIconContainer}>
          <Ionicons 
            name={isPlaying ? "volume-high" : "volume-medium-outline"} 
            size={18} 
            color={isPlaying ? theme.colors.primary : '#6B9BD2'} 
          />
          {!isPlaying && (
            <Ionicons 
              name="play" 
              size={10} 
              color="#6B9BD2" 
              style={styles.playIndicator}
            />
          )}
        </View>
        <Text style={styles.pronunciationText}>{pronunciationHint}</Text>
        {!isPlaying && <Text style={styles.tapHint}>Tap to hear</Text>}
      </TouchableOpacity>
    </View>
  );
}

interface MCQCardProps {
  question: string;
  options: string[];
  correctAnswer: string;
  onAnswer: (answer: string, isCorrect: boolean) => void;
  answered: boolean;
  userAnswer?: string;
}

function MCQCard({ question, options, correctAnswer, onAnswer, answered, userAnswer }: MCQCardProps) {
  const handleSelect = (option: string) => {
    if (answered) return;
    const isCorrect = option === correctAnswer;
    onAnswer(option, isCorrect);
  };

  return (
    <View style={styles.interactiveCard}>
      <Text style={styles.cardQuestion}>{question}</Text>
      <View style={styles.optionsContainer}>
        {options.map((option, index) => {
          const isSelected = userAnswer === option;
          const isCorrectOption = option === correctAnswer;
          const showCorrect = answered && isCorrectOption;
          const showIncorrect = answered && isSelected && !isCorrectOption;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                isSelected && styles.optionSelected,
                showCorrect && styles.optionCorrect,
                showIncorrect && styles.optionIncorrect,
              ]}
              onPress={() => handleSelect(option)}
              disabled={answered}
            >
              <Text style={styles.optionText}>
                {option}
              </Text>
              {showCorrect && (
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success500} />
              )}
              {showIncorrect && (
                <Ionicons name="close-circle" size={20} color={theme.colors.destructive} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

interface GapCardProps {
  prompt: string;
  expectedAnswers: string[];
  onAnswer: (answer: string, isCorrect: boolean) => void;
  answered: boolean;
}

function GapCard({ prompt, expectedAnswers, onAnswer, answered }: GapCardProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = () => {
    if (!inputValue.trim() || answered) return;
    const isCorrect = expectedAnswers.some(
      answer => answer.toLowerCase().trim() === inputValue.toLowerCase().trim()
    );
    onAnswer(inputValue, isCorrect);
  };

  return (
    <View style={styles.interactiveCard}>
      <Text style={styles.cardPrompt}>{prompt}</Text>
      <View style={styles.gapInputRow}>
        <TextInput
          style={[styles.gapInput, answered && styles.gapInputDisabled]}
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Type your answer..."
          placeholderTextColor={theme.colors.mutedForeground}
          editable={!answered}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {!answered && (
          <TouchableOpacity style={styles.gapSubmitButton} onPress={handleSubmit}>
            <Ionicons name="arrow-forward" size={20} color={theme.colors.primaryForeground} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

interface ExpandCardProps {
  prompt: string;
  options: string[];
  validation?: string;
  onAnswer: (answer: string) => void;
  answered: boolean;
  selectedOptions?: string[];
}

function ExpandCard({ prompt, options, validation, onAnswer, answered, selectedOptions = [] }: ExpandCardProps) {
  const [selected, setSelected] = useState<string[]>(selectedOptions);

  useEffect(() => {
    if (selectedOptions.length > 0) {
      setSelected(selectedOptions);
    }
  }, [selectedOptions]);

  const handleSelect = (option: string) => {
    if (answered) return;
    setSelected(prev => {
      if (prev.includes(option)) {
        return prev.filter(o => o !== option);
      }
      return [...prev, option];
    });
  };

  const handleSubmit = () => {
    if (answered || selected.length === 0) return;
    onAnswer(selected.join(', '));
  };

  return (
    <View style={styles.interactiveCard}>
      <Text style={styles.cardPrompt}>{prompt}</Text>
      <Text style={styles.cardLabel}>Select all that apply:</Text>
      <View style={styles.optionsContainer}>
        {options.map((option, index) => {
          const isSelected = selected.includes(option);
          const showSelected = answered && isSelected;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                isSelected && styles.optionSelected,
                showSelected && styles.optionCorrect,
              ]}
              onPress={() => handleSelect(option)}
              disabled={answered}
            >
              <Text style={styles.optionText}>{option}</Text>
              {isSelected && !answered && (
                <Ionicons name="checkmark" size={18} color={theme.colors.accent} />
              )}
              {showSelected && (
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success500} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      {!answered && (
        <TouchableOpacity 
          style={[styles.submitButton, selected.length === 0 && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={selected.length === 0}
        >
          <Text style={styles.submitButtonText}>Confirm Selection</Text>
        </TouchableOpacity>
      )}
      {answered && validation && (
        <View style={styles.validationBox}>
          <Text style={styles.validationText}>{validation}</Text>
        </View>
      )}
    </View>
  );
}

interface FreeInputCardProps {
  prompt: string;
  expectedAnswers: string[];
  onAnswer: (answer: string, isCorrect: boolean) => void;
  answered: boolean;
  cardType: 'translateBack' | 'speech' | 'context';
  language: string;
}

function FreeInputCard({ prompt, expectedAnswers, onAnswer, answered, cardType, language }: FreeInputCardProps) {
  const [inputValue, setInputValue] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'mic'>('text');

  const handleSubmit = () => {
    if (!inputValue.trim() || answered) return;
    const normalizedInput = inputValue.toLowerCase().trim().replace(/[?!.,]/g, '');
    const isCorrect = expectedAnswers.some(answer => {
      const normalizedAnswer = answer.toLowerCase().trim().replace(/[?!.,]/g, '');
      return normalizedAnswer === normalizedInput || 
             normalizedAnswer.includes(normalizedInput) ||
             normalizedInput.includes(normalizedAnswer);
    });
    onAnswer(inputValue, isCorrect);
  };

  const handleSpeechResult = (isCorrect: boolean, transcription: string) => {
    onAnswer(transcription, isCorrect);
  };

  const getCardTitle = () => {
    switch (cardType) {
      case 'translateBack': return 'Translate to Italian:';
      case 'speech': return 'Say out loud:';
      case 'context': return 'Respond in Italian:';
      default: return '';
    }
  };

  const getLanguageName = (lang: string): string => {
    const langMap: { [key: string]: string } = {
      'it': 'italian',
      'es': 'spanish',
      'fr': 'french',
      'de': 'german',
      'en': 'english',
    };
    return langMap[lang.toLowerCase()] || lang;
  };

  if (answered) {
    return (
      <View style={styles.interactiveCard}>
        <Text style={styles.cardLabel}>{getCardTitle()}</Text>
        <Text style={styles.cardPrompt}>{prompt}</Text>
        <Text style={styles.answeredNote}>Answer submitted</Text>
      </View>
    );
  }

  return (
    <View style={styles.interactiveCard}>
      <Text style={styles.cardLabel}>{getCardTitle()}</Text>
      <Text style={styles.cardPrompt}>{prompt}</Text>
      
      <View style={styles.inputModeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, inputMode === 'text' && styles.modeButtonActive]}
          onPress={() => setInputMode('text')}
        >
          <Ionicons name="keypad-outline" size={18} color={inputMode === 'text' ? theme.colors.primaryForeground : theme.colors.mutedForeground} />
          <Text style={[styles.modeButtonText, inputMode === 'text' && styles.modeButtonTextActive]}>Type</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, inputMode === 'mic' && styles.modeButtonActive]}
          onPress={() => setInputMode('mic')}
        >
          <Ionicons name="mic-outline" size={18} color={inputMode === 'mic' ? theme.colors.primaryForeground : theme.colors.mutedForeground} />
          <Text style={[styles.modeButtonText, inputMode === 'mic' && styles.modeButtonTextActive]}>Speak</Text>
        </TouchableOpacity>
      </View>

      {inputMode === 'text' ? (
        <View style={styles.gapInputRow}>
          <TextInput
            style={styles.gapInput}
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Type your answer..."
            placeholderTextColor={theme.colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.gapSubmitButton} onPress={handleSubmit}>
            <Ionicons name="arrow-forward" size={20} color={theme.colors.primaryForeground} />
          </TouchableOpacity>
        </View>
      ) : (
        <SpeakBackComponent
          expectedAnswer={expectedAnswers[0] || ''}
          alternativeAnswers={expectedAnswers.slice(1)}
          language={getLanguageName(language)}
          onResult={handleSpeechResult}
          onSwitchToText={() => setInputMode('text')}
          showPronunciationButton={true}
        />
      )}
    </View>
  );
}

interface ChatInputBarProps {
  mode: 'keyboard' | 'mic';
  onModeToggle: () => void;
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

function ChatInputBar({ mode, onModeToggle, onSendMessage, disabled }: ChatInputBarProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
  };

  return (
    <View style={styles.inputBar}>
      <TouchableOpacity style={styles.modeToggle} onPress={onModeToggle}>
        <Ionicons 
          name={mode === 'keyboard' ? 'mic-outline' : 'keypad-outline'} 
          size={24} 
          color={theme.colors.mutedForeground} 
        />
      </TouchableOpacity>
      
      {mode === 'keyboard' ? (
        <>
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.mutedForeground}
            editable={!disabled}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!text.trim() || disabled}
          >
            <Ionicons name="send" size={20} color={theme.colors.primaryForeground} />
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.micContainer}>
          <TouchableOpacity style={styles.micButton}>
            <Ionicons name="mic" size={28} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.micHint}>Tap to speak</Text>
        </View>
      )}
    </View>
  );
}

interface ContinueButtonProps {
  onContinue: () => void;
  disabled?: boolean;
}

function ContinueButton({ onContinue, disabled }: ContinueButtonProps) {
  return (
    <View style={styles.continueWrapper}>
      <TouchableOpacity 
        style={[styles.continueButton, disabled && styles.continueButtonDisabled]} 
        onPress={onContinue}
        disabled={disabled}
      >
        <Text style={styles.continueButtonText}>Tap to continue</Text>
        <Ionicons name="chevron-forward" size={18} color={theme.colors.primaryForeground} />
      </TouchableOpacity>
    </View>
  );
}

export default function ChatLessonScreen() {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentPhrase, setCurrentPhrase] = useState<V2Phrase | null>(null);
  const [inputMode, setInputMode] = useState<'keyboard' | 'mic'>('keyboard');
  const [isLoading, setIsLoading] = useState(true);
  const [currentMethodIndex, setCurrentMethodIndex] = useState(0);
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);
  const [waitingForContinue, setWaitingForContinue] = useState(false);
  
  const methodIndexRef = useRef(0);
  const methodsRef = useRef<string[]>([]);
  const phraseRef = useRef<V2Phrase | null>(null);

  useEffect(() => {
    loadPhraseData();
  }, []);

  useEffect(() => {
    // Scroll to end when new content is added, with slight delay to ensure UI renders
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
    return () => clearTimeout(timer);
  }, [messages]);

  const loadPhraseData = async () => {
    try {
      setIsLoading(true);
      // Fetch specific phrase 'A15_01' which has expand_prompt and expand_options
      const phrase = await apiClient.getV2PhraseById('A15_01');
      
      if (phrase) {
        setCurrentPhrase(phrase);
        buildMethodsFromPhrase(phrase);
      } else {
        addCoachMessage("No phrases available yet. Check back soon!");
      }
    } catch (error) {
      console.error('Error loading phrases:', error);
      addCoachMessage("Couldn't load lesson data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const buildMethodsFromPhrase = (phrase: V2Phrase) => {
    const methods: string[] = [];
    
    if (phrase.recognitionMcqQuestion && phrase.recognitionMcqOptions) {
      methods.push('recognition_mcq');
    }
    if (phrase.productionGapMask && phrase.productionGapAnswers) {
      methods.push('production_gap');
    }
    if (phrase.translateBackPrompt && phrase.translateBackExpected) {
      methods.push('translate_back');
    }
    if (phrase.speechPrompt && phrase.speechKeywords) {
      methods.push('speech');
    }
    if (phrase.contextVariations && phrase.contextVariations.length > 0) {
      methods.push('context');
    }
    if (phrase.expandPrompt && phrase.expandOptions) {
      methods.push('expand');
    }

    setAvailableMethods(methods);
    methodsRef.current = methods;
    phraseRef.current = phrase;
    methodIndexRef.current = 0;
    setCurrentMethodIndex(0);

    const introMessages: ChatMessage[] = [
      {
        id: `intro-1`,
        type: 'coach_text',
        content: `Let's learn a new phrase! 🎯`,
      },
      {
        id: `intro-2`,
        type: 'coach_text',
        content: `"${phrase.phrase}"`,
      },
      {
        id: `intro-3`,
        type: 'coach_text',
        content: `This means: "${phrase.translation}"`,
      },
    ];

    if (phrase.meaningNote) {
      introMessages.push({
        id: `intro-4`,
        type: 'coach_text',
        content: `💡 ${phrase.meaningNote}`,
      });
    }

    if (phrase.pronunciationHint) {
      introMessages.push({
        id: `intro-5`,
        type: 'pronunciation_bubble',
        content: phrase.pronunciationHint,
        phraseText: phrase.phrase,
        language: phrase.language,
      });
    }

    introMessages.push({
      id: `continue-intro`,
      type: 'continue_button',
      content: 'Tap to continue',
    });

    setMessages(introMessages);
    setWaitingForContinue(true);
  };

  const handleContinue = () => {
    setWaitingForContinue(false);
    setMessages(prev => prev.filter(msg => msg.type !== 'continue_button'));
    
    const phrase = phraseRef.current;
    const methods = methodsRef.current;
    
    if (phrase && methods.length > 0) {
      showNextMethod(phrase, methods, 0);
    }
  };

  const showNextMethod = (phrase: V2Phrase, methods: string[], index: number) => {
    if (index >= methods.length) {
      addCoachMessage("Great job! You've completed this phrase! 🎉");
      return;
    }

    const method = methods[index];
    setCurrentMethodIndex(index);

    switch (method) {
      case 'recognition_mcq':
        if (phrase.recognitionMcqQuestion && phrase.recognitionMcqOptions && phrase.recognitionMcqAnswer) {
          const mcqOptions = phrase.recognitionMcqOptions;
          const mcqAnswer = phrase.recognitionMcqAnswer;
          
          // Extract scenario by removing the phrase from the question
          let scenario = phrase.recognitionMcqQuestion;
          const phrasePattern = new RegExp(`[:\\s]*${phrase.phrase.replace(/[?]/g, '\\?')}[?\\s]*$`, 'i');
          
          if (phrasePattern.test(scenario)) {
            scenario = scenario.replace(phrasePattern, '').trim();
          } else if (scenario.includes(phrase.phrase)) {
            // Fallback: remove phrase wherever it appears
            scenario = scenario.replace(phrase.phrase, '').replace(/[:\s]+$/, '').trim();
          }
          
          // Format: scenario + phrase in quotes + instruction
          const formattedQuestion = `${scenario}\n\n"${phrase.phrase}"\n\nConfirm the meaning from the below:`;
          
          setMessages(prev => [...prev, {
            id: `mcq-${index}`,
            type: 'mcq_card' as const,
            content: formattedQuestion,
            options: mcqOptions,
            correctAnswer: mcqAnswer,
            answered: false,
          }]);
        }
        break;

      case 'production_gap':
        if (phrase.productionGapMask && phrase.productionGapAnswers) {
          addCoachMessage("Now complete this phrase:");
          const gapMask = phrase.productionGapMask;
          const gapAnswers = phrase.productionGapAnswers;
          setMessages(prev => [...prev, {
            id: `gap-${index}`,
            type: 'gap_card' as const,
            content: gapMask,
            options: gapAnswers,
            answered: false,
          }]);
        }
        break;

      case 'translate_back':
        if (phrase.translateBackPrompt && phrase.translateBackExpected) {
          const translatePrompt = phrase.translateBackPrompt;
          const translateExpected = phrase.translateBackExpected;
          setMessages(prev => [...prev, {
            id: `translate-${index}`,
            type: 'translate_back_card' as const,
            content: translatePrompt,
            expectedAnswers: translateExpected,
            cardType: 'translateBack',
            answered: false,
          }]);
        }
        break;

      case 'speech':
        if (phrase.speechPrompt && phrase.speechKeywords) {
          const speechPrompt = phrase.speechPrompt;
          const speechKeywords = phrase.speechKeywords;
          setMessages(prev => [...prev, {
            id: `speech-${index}`,
            type: 'speech_card' as const,
            content: speechPrompt,
            expectedAnswers: speechKeywords,
            cardType: 'speech',
            answered: false,
          }]);
        }
        break;

      case 'context':
        if (phrase.contextVariations && phrase.contextVariations.length > 0) {
          const variation = phrase.contextVariations[0];
          addCoachMessage(`Scenario: ${variation.scenario}`);
          setMessages(prev => [...prev, {
            id: `context-${index}`,
            type: 'context_card' as const,
            content: variation.prompt,
            expectedAnswers: [variation.expected],
            cardType: 'context',
            answered: false,
          }]);
        }
        break;

      case 'expand':
        if (phrase.expandPrompt && phrase.expandOptions) {
          addCoachMessage("Now, let's expand on this phrase!");
          setMessages(prev => [...prev, {
            id: `expand-${index}`,
            type: 'expand_card' as const,
            content: phrase.expandPrompt!,
            options: phrase.expandOptions!,
            validation: phrase.expandValidation || undefined,
            answered: false,
            userAnswer: '',
          }]);
        }
        break;
    }
  };

  const addCoachMessage = (content: string, isPrompt?: boolean) => {
    setMessages(prev => [...prev, {
      id: `coach-${Date.now()}`,
      type: isPrompt ? 'coach_prompt' : 'coach_text',
      content,
    }]);
  };

  const advanceToNextMethod = () => {
    const nextIndex = methodIndexRef.current + 1;
    methodIndexRef.current = nextIndex;
    setCurrentMethodIndex(nextIndex);
    
    const phrase = phraseRef.current;
    const methods = methodsRef.current;
    
    if (phrase && methods.length > 0) {
      showNextMethod(phrase, methods, nextIndex);
    }
  };

  const handleMCQAnswer = (messageId: string, answer: string, isCorrect: boolean) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, answered: true, userAnswer: answer, isCorrect }
        : msg
    ));

    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      type: 'user_response',
      content: answer,
      isCorrect,
    }]);

    setTimeout(() => {
      if (isCorrect) {
        addCoachMessage("Nice! That's correct! ✓");
      } else {
        addCoachMessage("Not quite. The correct answer was shown above.");
      }

      setTimeout(() => {
        advanceToNextMethod();
      }, 1000);
    }, 500);
  };

  const handleGapAnswer = (messageId: string, answer: string, isCorrect: boolean, correctAnswerList: string[]) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, answered: true, userAnswer: answer, isCorrect }
        : msg
    ));

    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      type: 'user_response',
      content: answer,
      isCorrect,
    }]);

    setTimeout(() => {
      if (isCorrect) {
        addCoachMessage("Excellent! You got it! 🌟");
      } else {
        const correctAnswer = correctAnswerList[0] || 'the expected answer';
        addCoachMessage(`Close! The answer was "${correctAnswer}".`);
      }

      setTimeout(() => {
        advanceToNextMethod();
      }, 1000);
    }, 500);
  };

  const handleFreeInputAnswer = (messageId: string, answer: string, isCorrect: boolean, cardType: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, answered: true, userAnswer: answer, isCorrect }
        : msg
    ));

    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      type: 'user_response',
      content: answer,
      isCorrect,
    }]);

    setTimeout(() => {
      if (isCorrect) {
        const successMessages: Record<string, string> = {
          translateBack: "Perfect translation! 🎯",
          speech: "Great pronunciation! 🗣️",
          context: "Excellent response! 💯",
        };
        addCoachMessage(successMessages[cardType] || "Well done! ✓");
      } else {
        addCoachMessage("Good try! Keep practicing.");
      }

      setTimeout(() => {
        advanceToNextMethod();
      }, 1000);
    }, 500);
  };

  const handleExpandAnswer = (messageId: string, answer: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, answered: true, userAnswer: answer }
        : msg
    ));

    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      type: 'user_response',
      content: `Selected: ${answer}`,
      isCorrect: true,
    }]);

    setTimeout(() => {
      addCoachMessage("Great job exploring new variations! 🎉");
      
      setTimeout(() => {
        advanceToNextMethod();
      }, 1000);
    }, 500);
  };

  const handleSendMessage = (message: string) => {
    setMessages(prev => [...prev, {
      id: `user-${Date.now()}`,
      type: 'user_response',
      content: message,
    }]);
  };

  const toggleInputMode = () => {
    setInputMode(prev => prev === 'keyboard' ? 'mic' : 'keyboard');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentPhrase?.phrase || 'Chat Lesson'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => {
            switch (message.type) {
              case 'coach_text':
              case 'coach_prompt':
                return (
                  <CoachBubble 
                    key={message.id} 
                    content={message.content}
                    isPrompt={message.type === 'coach_prompt'}
                  />
                );
              
              case 'feedback_success':
                return (
                  <CoachBubble 
                    key={message.id} 
                    content={message.content}
                    isFeedback="success"
                  />
                );
              
              case 'feedback_error':
                return (
                  <CoachBubble 
                    key={message.id} 
                    content={message.content}
                    isFeedback="error"
                  />
                );

              case 'user_response':
                return (
                  <UserBubble 
                    key={message.id} 
                    content={message.content}
                    isCorrect={message.isCorrect}
                  />
                );

              case 'mcq_card':
                return (
                  <View key={message.id} style={styles.cardWrapper}>
                    <MCQCard
                      question={message.content}
                      options={message.options || []}
                      correctAnswer={message.correctAnswer || ''}
                      onAnswer={(answer, isCorrect) => handleMCQAnswer(message.id, answer, isCorrect)}
                      answered={message.answered || false}
                      userAnswer={message.userAnswer}
                    />
                  </View>
                );

              case 'gap_card':
                const expectedAnswers = message.options || [];
                return (
                  <View key={message.id} style={styles.cardWrapper}>
                    <GapCard
                      prompt={message.content}
                      expectedAnswers={expectedAnswers}
                      onAnswer={(answer, isCorrect) => handleGapAnswer(message.id, answer, isCorrect, expectedAnswers)}
                      answered={message.answered || false}
                    />
                  </View>
                );

              case 'translate_back_card':
              case 'speech_card':
              case 'context_card':
                const freeInputExpected = message.expectedAnswers || [];
                const cardType = message.cardType || 'translateBack';
                return (
                  <View key={message.id} style={styles.cardWrapper}>
                    <FreeInputCard
                      prompt={message.content}
                      expectedAnswers={freeInputExpected}
                      onAnswer={(answer, isCorrect) => handleFreeInputAnswer(message.id, answer, isCorrect, cardType)}
                      answered={message.answered || false}
                      cardType={cardType}
                      language={message.language || phraseRef.current?.language || 'it'}
                    />
                  </View>
                );

              case 'expand_card':
                const expandSelectedOptions = message.userAnswer ? message.userAnswer.split(', ') : [];
                return (
                  <View key={message.id} style={styles.cardWrapper}>
                    <ExpandCard
                      prompt={message.content}
                      options={message.options || []}
                      validation={message.validation}
                      onAnswer={(answer) => handleExpandAnswer(message.id, answer)}
                      answered={message.answered || false}
                      selectedOptions={expandSelectedOptions}
                    />
                  </View>
                );

              case 'pronunciation_bubble':
                return (
                  <PronunciationBubble
                    key={message.id}
                    pronunciationHint={message.content}
                    phraseText={message.phraseText || ''}
                    language={message.language || 'it'}
                  />
                );

              case 'continue_button':
                return (
                  <ContinueButton
                    key={message.id}
                    onContinue={handleContinue}
                    disabled={!waitingForContinue}
                  />
                );

              default:
                return null;
            }
          })}
        </ScrollView>

        <ChatInputBar
          mode={inputMode}
          onModeToggle={toggleInputMode}
          onSendMessage={handleSendMessage}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  headerSpacer: {
    width: 32,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },

  coachRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: theme.spacing.md,
    maxWidth: '85%',
  },
  bubbleBase: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: 18,
    maxWidth: '100%',
  },
  coachBubble: {
    backgroundColor: theme.colors.surfaceContainer,
    borderBottomLeftRadius: 4,
  },
  coachBubblePrompt: {
    backgroundColor: theme.colors.muted,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  coachBubbleSuccess: {
    backgroundColor: theme.colors.success50,
    borderBottomLeftRadius: 4,
  },
  coachBubbleError: {
    backgroundColor: theme.colors.errorContainer,
    borderBottomLeftRadius: 4,
  },
  coachText: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    lineHeight: 22,
  },

  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: theme.spacing.md,
  },
  userBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
    maxWidth: '75%',
  },
  userBubbleCorrect: {
    backgroundColor: theme.colors.success500,
  },
  userBubbleIncorrect: {
    backgroundColor: theme.colors.destructive,
  },
  userText: {
    color: theme.colors.primaryForeground,
    fontSize: theme.fontSize.base,
    lineHeight: 22,
  },

  cardWrapper: {
    marginVertical: theme.spacing.md,
  },
  interactiveCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardQuestion: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    fontWeight: '500',
    marginBottom: theme.spacing.lg,
  },
  cardPrompt: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: theme.spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceContainer,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  optionCorrect: {
    borderColor: theme.colors.success500,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  optionIncorrect: {
    borderColor: theme.colors.destructive,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  optionText: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '600',
  },

  gapInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  gapInput: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  gapInputDisabled: {
    opacity: 0.6,
  },
  gapSubmitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: theme.colors.primaryForeground,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
  },
  validationBox: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent,
  },
  validationText: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.sm,
    lineHeight: 20,
  },

  cardLabel: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputModeToggle: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceContainer,
    gap: theme.spacing.xs,
  },
  modeButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  modeButtonText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: theme.colors.primaryForeground,
  },
  micInputContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  micRecordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  micRecordButtonActive: {
    backgroundColor: theme.colors.errorContainer,
    borderColor: theme.colors.destructive,
  },
  micHintText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    gap: theme.spacing.sm,
  },
  modeToggle: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: 20,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.muted,
  },
  micContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  micButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  micHint: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
  },

  continueWrapper: {
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: theme.colors.primaryForeground,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
  },

  pronunciationBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainer,
    borderBottomLeftRadius: 4,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  pronunciationBubblePlaying: {
    backgroundColor: theme.colors.muted,
  },
  pronunciationIcon: {
    marginRight: theme.spacing.sm,
  },
  pronunciationIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  playIndicator: {
    marginLeft: -2,
    marginTop: 6,
  },
  pronunciationText: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    lineHeight: 22,
    fontStyle: 'italic',
    flex: 1,
  },
  tapHint: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.xs,
    marginLeft: theme.spacing.sm,
  },
  answeredNote: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing.md,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
