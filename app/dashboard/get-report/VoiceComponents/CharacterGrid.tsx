"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CirclePause,
  CirclePlay,
  Palette,
  RefreshCcw,
  Timer,
  Type,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const CHARACTERS = [
  "7",
  "K",
  "3",
  "M",
  "B",
  "L",
  "E",
  "2",
  "G",
  "1",
  "4",
  "R",
  "I",
  "P",
  "0",
  "D",
  "8",
  "T",
  "O",
  "5",
  "S",
  "6",
  "F",
  "9",
  "A",
  "N",
  "U",
  "H",
  "C",
  "J",
] as const;

const CHARACTER_COLORS = [
  "#000000",
  "#d7191c",
  "#0057b8",
  "#00843d",
  "#e66a00",
  "#6a1b9a",
] as const;

const DEFAULT_DELAY_MS = 800;
const MIN_DELAY_MS = 150;
const MAX_DELAY_MS = 3000;
const DELAY_STEP_MS = 50;

type ColorMode = "black" | "random";

interface CharacterGridProps {
  /**
   * Called immediately before automatic playback begins.
   *
   * Voice.tsx can use this to start microphone recording.
   * Playback waits for this callback when it returns a Promise.
   */
  onSequenceStart?: () => void | Promise<void>;

  /**
   * Called when the final character has finished.
   */
  onSequenceComplete?: () => void;

  /**
   * Prevents starting playback while the parent is busy.
   */
  disabled?: boolean;
}

function getRandomCharacterColor(): string {
  const index = Math.floor(Math.random() * CHARACTER_COLORS.length);

  return CHARACTER_COLORS[index];
}

function formatDelay(delayMs: number): string {
  return `${(delayMs / 1000).toFixed(2)} s`;
}

export function CharacterGrid({
  onSequenceStart,
  onSequenceComplete,
  disabled = false,
}: CharacterGridProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const [delayMs, setDelayMs] = useState(DEFAULT_DELAY_MS);

  const [colorMode, setColorMode] = useState<ColorMode>("black");

  const [randomColor, setRandomColor] = useState<string>(() =>
    getRandomCharacterColor(),
  );

  const characterColor = colorMode === "black" ? "#000000" : randomColor;

  // const [characterColor, setCharacterColor] = useState("#000000");

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentCharacter = CHARACTERS[currentIndex];

  const totalCharacters = CHARACTERS.length;

  const isFirstCharacter = currentIndex === 0;

  const isLastCharacter = currentIndex === totalCharacters - 1;

  const progress = ((currentIndex + 1) / totalCharacters) * 100;

  const clearPlaybackTimer = useCallback(() => {
    if (!timerRef.current) {
      return;
    }

    clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const pausePlayback = useCallback(() => {
    clearPlaybackTimer();
    setIsPlaying(false);
  }, [clearPlaybackTimer]);

  const moveToPreviousCharacter = useCallback(() => {
    pausePlayback();

    setCurrentIndex((previousIndex) => Math.max(previousIndex - 1, 0));
  }, [pausePlayback]);

  const moveToNextCharacter = useCallback(() => {
    pausePlayback();

    setCurrentIndex((previousIndex) =>
      Math.min(previousIndex + 1, totalCharacters - 1),
    );
  }, [pausePlayback, totalCharacters]);

  const restartSequence = useCallback(() => {
    pausePlayback();
    setCurrentIndex(0);
  }, [pausePlayback]);

  const startPlayback = useCallback(async () => {
    if (disabled || isPlaying || isStarting) {
      return;
    }

    setIsStarting(true);

    try {
      /*
       * If the sequence previously completed,
       * Start begins again from character #1.
       */
      if (isLastCharacter) {
        setCurrentIndex(0);
      }

      /*
       * Voice.tsx can start microphone/Praat
       * recording here.
       *
       * Awaiting it means character playback does
       * not begin until recording initialization
       * succeeds.
       */
      await onSequenceStart?.();

      setIsPlaying(true);
    } catch (error) {
      console.error("Unable to start character sequence.", error);

      setIsPlaying(false);
    } finally {
      setIsStarting(false);
    }
  }, [disabled, isLastCharacter, isPlaying, isStarting, onSequenceStart]);

  const togglePlayback = useCallback(async () => {
    if (isPlaying) {
      pausePlayback();
      return;
    }

    await startPlayback();
  }, [isPlaying, pausePlayback, startPlayback]);

  /*
   * Every time the visible character changes,
   * assign its display color.
   */
  // useEffect(() => {
  //   updateCharacterColor();
  // }, [currentIndex, colorMode, updateCharacterColor]);

  /*
   * Automatic character progression.
   *
   * setTimeout rather than setInterval gives us
   * better control when speed changes while playing.
   */
  useEffect(() => {
    clearPlaybackTimer();

    if (!isPlaying) {
      return;
    }

    timerRef.current = setTimeout(() => {
      if (currentIndex < totalCharacters - 1) {
        setCurrentIndex((previousIndex) => previousIndex + 1);

        return;
      }

      setIsPlaying(false);
      timerRef.current = null;

      onSequenceComplete?.();
    }, delayMs);

    return clearPlaybackTimer;
  }, [
    clearPlaybackTimer,
    currentIndex,
    delayMs,
    isPlaying,
    onSequenceComplete,
    totalCharacters,
  ]);

  function handleBlackMode() {
    setColorMode("black");
  }

  function handleRandomMode() {
    setRandomColor(getRandomCharacterColor());

    setColorMode("random");
  }

  /*
   * Keyboard controls from the supplied HTML:
   *
   * Space       = Start / Pause
   * Arrow Left  = Previous
   * Arrow Right = Next
   */
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;

      const tagName = target?.tagName.toLowerCase();

      /*
       * Do not hijack keyboard input while the
       * user is interacting with a form control.
       */
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        void togglePlayback();
        return;
      }

      if (event.code === "ArrowLeft") {
        event.preventDefault();
        moveToPreviousCharacter();
        return;
      }

      if (event.code === "ArrowRight") {
        event.preventDefault();
        moveToNextCharacter();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [moveToNextCharacter, moveToPreviousCharacter, togglePlayback]);

  /*
   * Defensive cleanup if CharacterGrid unmounts
   * during playback.
   */
  useEffect(() => {
    return () => {
      clearPlaybackTimer();
    };
  }, [clearPlaybackTimer]);

  return (
    <div className="mb-lg  overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
      {/* Character display */}
      <div className="relative flex h-64 flex-col bg-slate-50">
        {/* Top status */}
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Type className="size-3.5" aria-hidden="true" />
            Pronounce
          </div>

          <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold tabular-nums text-slate-600">
            {currentIndex + 1} / {totalCharacters}
          </div>
        </div>

        {/* Large character */}
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-3">
          <span
            key={`${currentIndex}-${colorMode}`}
            className="select-none font-display text-[9rem] font-black leading-none transition-colors duration-150"
            style={{
              color: characterColor,
            }}
            aria-live="polite"
            aria-atomic="true"
          >
            {currentCharacter}
          </span>
        </div>

        {/* Progress */}
        <div className="px-4 pb-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Main controls */}
      <div className="border-t border-slate-200 p-3">
        <div className="grid grid-cols-[40px_1fr_40px] gap-2">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            size="icon"
            onClick={moveToPreviousCharacter}
            disabled={disabled || isStarting || isFirstCharacter}
            aria-label="Previous character"
            title="Previous character"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>

          <Button
            type="button"
            onClick={() => {
              void togglePlayback();
            }}
            disabled={disabled || isStarting}
            className="gap-2 cursor-pointer"
          >
            {isStarting ? (
              <>
                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />
                Starting...
              </>
            ) : isPlaying ? (
              <>
                <CirclePause className="size-4" aria-hidden="true" />
                Pause
              </>
            ) : (
              <>
                <CirclePlay className="size-4" aria-hidden="true" />
                Start
              </>
            )}
          </Button>

          <Button
            type="button"
            className="cursor-pointer"
            variant="outline"
            size="icon"
            onClick={moveToNextCharacter}
            disabled={disabled || isStarting || isLastCharacter}
            aria-label="Next character"
            title="Next character"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={restartSequence}
          disabled={disabled || isStarting || (isFirstCharacter && !isPlaying)}
          className="mt-2 w-full text-slate-600 cursor-pointer"
        >
          <RefreshCcw className="size-3.5" aria-hidden="true" />
          Restart sequence
        </Button>
      </div>

      {/* Speed */}
      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <label
            htmlFor="character-reader-speed"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
          >
            <Timer className="size-3.5" aria-hidden="true" />
            Speed
          </label>

          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold tabular-nums text-slate-700">
            {formatDelay(delayMs)}
          </span>
        </div>

        <input
          id="character-reader-speed"
          type="range"
          min={MIN_DELAY_MS}
          max={MAX_DELAY_MS}
          step={DELAY_STEP_MS}
          value={delayMs}
          disabled={disabled || isStarting}
          onChange={(event) => {
            setDelayMs(Number(event.target.value));
          }}
          className="h-2 w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
        />

        <div className="mt-1.5 flex justify-between text-[10px] font-medium text-slate-400">
          <span>Fast</span>
          <span>Slow</span>
        </div>
      </div>

      {/* Color mode */}
      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 flex items-center gap-1.5 px-1 text-xs font-semibold text-slate-700">
          <Palette className="size-3.5" aria-hidden="true" />
          Character color
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* <Button
            type="button"
            size="sm"
            variant={colorMode === "black" ? "default" : "outline"}
            onClick={() => setColorMode("black")}
            disabled={disabled}
            aria-pressed={colorMode === "black"}
            className="text-xs"
          >
            Black
          </Button> */}

          <Button
            type="button"
            size="sm"
            variant={colorMode === "black" ? "default" : "outline"}
            onClick={handleBlackMode}
            disabled={disabled}
            aria-pressed={colorMode === "black"}
            className="text-xs cursor-pointer"
          >
            Black
          </Button>

          {/* <Button
            type="button"
            size="sm"
            variant={colorMode === "random" ? "default" : "outline"}
            onClick={() => setColorMode("random")}
            disabled={disabled}
            aria-pressed={colorMode === "random"}
            className="text-xs"
          >
            Random
          </Button> */}

          <Button
            type="button"
            size="sm"
            variant={colorMode === "random" ? "default" : "outline"}
            onClick={handleRandomMode}
            disabled={disabled}
            aria-pressed={colorMode === "random"}
            className="text-xs cursor-pointer"
          >
            Random
          </Button>
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="border-t border-slate-200 bg-slate-50 px-3 py-2.5 text-center text-[10px] leading-4 text-slate-500">
        <span className="font-semibold">Space</span> play/pause ·{" "}
        <span className="font-semibold">← →</span> navigate
      </div>
    </div>
  );
}
