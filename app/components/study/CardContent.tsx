import { useEffect, useRef, useState } from "react";
import { Box, IconButton } from "@radix-ui/themes";
import { SpeakerLoudIcon } from "@radix-ui/react-icons";
import { useAnkiConnect } from "../../lib/useAnkiConnect";
import type { CardInfo } from "../../lib/ankiconnect";

interface CardContentProps {
  html: string;
  css?: string;
  autoPlayAudio?: boolean;
  className?: string;
  style?: React.CSSProperties;
  cardInfo?: CardInfo;
}

export function CardContent({
  html,
  css,
  autoPlayAudio = false,
  className,
  style,
  cardInfo,
}: CardContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [processedHtml, setProcessedHtml] = useState(html);
  const { client } = useAnkiConnect();
  const audioCache = useRef<Map<string, string>>(new Map());
  const [isProcessing, setIsProcessing] = useState(false);

  // 当 html 改变时，重置处理状态
  useEffect(() => {
    setIsProcessing(false);
    setProcessedHtml(html);
  }, [html]);

  useEffect(() => {
    if (!client || isProcessing) return;

    const processContent = async () => {
      setIsProcessing(true);
      let content = html;

      console.log("[CardContent] Processing content, length:", content.length);

      // 收集所有需要替换的匹配项
      const replacements: Array<{ original: string; replacement: string }> = [];

      // 处理 [sound:filename] 格式
      const soundRegex = /\[sound:([^\]]+)\]/g;
      let soundMatch;
      while ((soundMatch = soundRegex.exec(content)) !== null) {
        const filename = soundMatch[1];
        console.log("[CardContent] Found [sound:] tag:", filename);
        const audioButton = await createAudioButton(filename);
        replacements.push({
          original: soundMatch[0],
          replacement: audioButton,
        });
      }

      // 处理 [anki:play:q:0] 或 [anki:play:a:0] 格式
      const ankiPlayRegex = /\[anki:play:([qa]):(\d+)\]/g;
      let ankiPlayMatch;
      while ((ankiPlayMatch = ankiPlayRegex.exec(content)) !== null) {
        const side = ankiPlayMatch[1];
        const index = parseInt(ankiPlayMatch[2]);
        console.log("[CardContent] Found [anki:play] tag:", ankiPlayMatch[0]);

        if (cardInfo) {
          const filename = extractAudioFilename(cardInfo, side, index);
          console.log("[CardContent] Extracted filename:", filename);
          if (filename) {
            const audioButton = await createAudioButton(filename);
            replacements.push({
              original: ankiPlayMatch[0],
              replacement: audioButton,
            });
          }
        }
      }

      console.log("[CardContent] Total replacements:", replacements.length);

      // 执行所有替换
      for (const { original, replacement } of replacements) {
        content = content.replace(original, replacement);
      }

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = content;

      const audioElements = tempDiv.querySelectorAll("audio");

      for (const audio of Array.from(audioElements)) {
        const src = audio.getAttribute("src");
        if (!src) continue;

        if (src.startsWith("http") || src.startsWith("data:")) {
          continue;
        }

        try {
          const filename = src.split("/").pop() || src;
          const base64Data = await client.retrieveMediaFile(filename);

          if (base64Data) {
            const mimeType = getMimeType(filename);
            audio.setAttribute("src", `data:${mimeType};base64,${base64Data}`);
          }
        } catch (error) {
          console.warn(`Failed to load audio file: ${src}`, error);
        }
      }

      const imgElements = tempDiv.querySelectorAll("img");
      for (const img of Array.from(imgElements)) {
        const src = img.getAttribute("src");
        if (!src) continue;

        if (src.startsWith("http") || src.startsWith("data:")) {
          continue;
        }

        try {
          const filename = src.split("/").pop() || src;
          const base64Data = await client.retrieveMediaFile(filename);

          if (base64Data) {
            const mimeType = getMimeType(filename);
            img.setAttribute("src", `data:${mimeType};base64,${base64Data}`);
          }
        } catch (error) {
          console.warn(`Failed to load image file: ${src}`, error);
        }
      }

      setProcessedHtml(tempDiv.innerHTML);
      setIsProcessing(false);
    };

    async function createAudioButton(filename: string): Promise<string> {
      if (!client) return `<span>[${filename}]</span>`;

      try {
        let base64Data = audioCache.current.get(filename);

        if (!base64Data) {
          const data = await client.retrieveMediaFile(filename);
          if (data) {
            base64Data = data;
            audioCache.current.set(filename, data);
          }
        }

        if (base64Data) {
          const mimeType = getMimeType(filename);
          const audioId = `audio-${Math.random().toString(36).substr(2, 9)}`;
          return `
            <span class="anki-audio-button" style="display: inline-flex; align-items: center; gap: 4px; margin: 0 4px;">
              <button
                onclick="document.getElementById('${audioId}').play()"
                style="
                  display: inline-flex;
                  align-items: center;
                  justify-content: center;
                  width: 28px;
                  height: 28px;
                  padding: 4px;
                  background: var(--accent-9);
                  color: white;
                  border: none;
                  border-radius: 4px;
                  cursor: pointer;
                  transition: background 0.2s;
                "
                onmouseover="this.style.background='var(--accent-10)'"
                onmouseout="this.style.background='var(--accent-9)'"
                title="${filename}"
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 1.5C8 1.22386 7.77614 1 7.5 1C7.22386 1 7 1.22386 7 1.5V13.5C7 13.7761 7.22386 14 7.5 14C7.77614 14 8 13.7761 8 13.5V1.5ZM10 3.5C10 3.22386 9.77614 3 9.5 3C9.22386 3 9 3.22386 9 3.5V11.5C9 11.7761 9.22386 12 9.5 12C9.77614 12 10 11.7761 10 11.5V3.5ZM12.5 5C12.7761 5 13 5.22386 13 5.5V9.5C13 9.77614 12.7761 10 12.5 10C12.2239 10 12 9.77614 12 9.5V5.5C12 5.22386 12.2239 5 12.5 5ZM6 5.5C6 5.22386 5.77614 5 5.5 5C5.22386 5 5 5.22386 5 5.5V9.5C5 9.77614 5.22386 10 5.5 10C5.77614 10 6 9.77614 6 9.5V5.5ZM3.5 7C3.77614 7 4 7.22386 4 7.5V7.5C4 7.77614 3.77614 8 3.5 8C3.22386 8 3 7.77614 3 7.5V7.5C3 7.22386 3.22386 7 3.5 7Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path>
                </svg>
              </button>
              <audio id="${audioId}" src="data:${mimeType};base64,${base64Data}" preload="auto" style="display: none;"></audio>
            </span>
          `;
        }
      } catch (error) {
        console.warn(`Failed to load audio: ${filename}`, error);
      }

      return `<span style="color: var(--gray-10); font-size: 0.9em;">[${filename}]</span>`;
    }

    function extractAudioFilename(
      card: CardInfo,
      side: string,
      index: number
    ): string | null {
      // 收集所有可能包含音频信息的 HTML 内容
      const htmlSources = [
        side === "q" ? card.question : card.answer,
        side === "q" ? card.frontSide : card.backSide,
      ];

      // 如果有字段数据，也从字段中查找
      if (card.fields) {
        Object.values(card.fields).forEach((field) => {
          if (field && typeof field === "object" && "value" in field) {
            htmlSources.push(field.value);
          }
        });
      }

      // 合并所有 HTML 内容
      const combinedHtml = htmlSources.join(" ");
      console.log("[CardContent] Searching in combined HTML, length:", combinedHtml.length);

      // 查找所有 [sound:filename] 标签
      const soundMatches = [...combinedHtml.matchAll(/\[sound:([^\]]+)\]/g)];
      console.log("[CardContent] Found [sound:] matches:", soundMatches.length);
      if (soundMatches[index]) {
        const filename = soundMatches[index][1];
        console.log("[CardContent] Using [sound:] filename:", filename);
        return filename;
      }

      // 查找所有 <audio src="..."> 标签
      const srcMatches = [
        ...combinedHtml.matchAll(/src=["']([^"']+\.(mp3|wav|ogg|m4a|flac|aac))["']/gi),
      ];
      console.log("[CardContent] Found src matches:", srcMatches.length);
      if (srcMatches[index]) {
        const src = srcMatches[index][1];
        const filename = src.split("/").pop() || src;
        console.log("[CardContent] Using src filename:", filename);
        return filename;
      }

      // 查找独立的音频文件名（常见格式）
      const fileMatches = [
        ...combinedHtml.matchAll(/([a-zA-Z0-9_-]+\.(mp3|wav|ogg|m4a|flac|aac))/gi),
      ];
      console.log("[CardContent] Found file matches:", fileMatches.length);
      if (fileMatches[index]) {
        const filename = fileMatches[index][1];
        console.log("[CardContent] Using file pattern filename:", filename);
        return filename;
      }

      console.log("[CardContent] No filename found for index:", index);
      return null;
    }

    processContent();
  }, [html, client, cardInfo]);

  useEffect(() => {
    if (!autoPlayAudio || !containerRef.current) return;

    const timer = setTimeout(async () => {
      const audioElements = containerRef.current?.querySelectorAll("audio");
      if (audioElements && audioElements.length > 0) {
        console.log("[CardContent] Playing audio files in sequence, total:", audioElements.length);

        // 按顺序播放每个音频
        for (let i = 0; i < audioElements.length; i++) {
          const audio = audioElements[i];
          console.log(`[CardContent] Playing audio ${i + 1}/${audioElements.length}`);

          try {
            // 等待音频播放完成
            await new Promise<void>((resolve, reject) => {
              audio.onended = () => {
                console.log(`[CardContent] Audio ${i + 1} ended`);
                resolve();
              };
              audio.onerror = () => {
                console.warn(`[CardContent] Audio ${i + 1} error`);
                resolve(); // 出错时也继续下一个
              };

              audio.play().catch((error) => {
                console.warn(`[CardContent] Audio ${i + 1} play failed:`, error);
                resolve(); // 播放失败时继续下一个
              });
            });
          } catch (error) {
            console.warn(`[CardContent] Audio ${i + 1} exception:`, error);
          }
        }

        console.log("[CardContent] All audio files played");
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [autoPlayAudio, processedHtml]);

  return (
    <>
      {css && <style>{css}</style>}
      <Box
        ref={containerRef}
        className={className}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
        style={style}
      />
    </>
  );
}

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    flac: "audio/flac",
    aac: "audio/aac",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
  };

  return mimeTypes[ext || ""] || "application/octet-stream";
}
