import type { Route } from "./+types/study";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  TextField,
  Card,
  Badge,
  IconButton,
  Separator,
} from "@radix-ui/themes";
import * as Toast from "@radix-ui/react-toast";
import {
  InfoCircledIcon,
  BookmarkIcon,
  PauseIcon,
  EyeNoneIcon,
  CheckIcon,
} from "@radix-ui/react-icons";
import { useAnkiConnect } from "../lib/useAnkiConnect";
import type { CardInfo } from "../lib/ankiconnect";
import { CardContent } from "../components/study/CardContent";
import { useTranslation } from "react-i18next";

export const meta: Route.MetaFunction = () => [
  { title: "Study - Anki Web" },
  { name: "description", content: "Study Anki cards" },
];

interface CardListItem {
  cardId: number;
  sortField: string;
}

interface StudySessionState {
  query: string;
  cardQueue: number[];
  cardList: CardListItem[];
  currentIndex: number;
  currentCard: CardInfo | null;
  showAnswer: boolean;
  answeredCardIds: Set<number>;
  sessionStats: {
    total: number;
    studied: number;
    again: number;
    hard: number;
    good: number;
    easy: number;
  };
}

export default function StudyPage() {
  const { t } = useTranslation();
  const { client, isConnected, error: connectionError } = useAnkiConnect();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [queryInput, setQueryInput] = useState("");
  const [session, setSession] = useState<StudySessionState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [showCardList, setShowCardList] = useState(true);

  // 当有错误时显示 toast
  useEffect(() => {
    if (error) {
      setToastOpen(true);
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const startSession = useCallback(
    async (query: string) => {
      if (!client) return;

      setIsLoading(true);
      setError(null);

      try {
        const cardIds = await client.findCards(query);

        if (cardIds.length === 0) {
          setError(t("study.errors.noCards"));
          setIsLoading(false);
          return;
        }

        const dueStatus = await client.areDue(cardIds);
        const dueCardIds = cardIds.filter((_, index) => dueStatus[index]);

        if (dueCardIds.length === 0) {
          setError(t("study.errors.noDue"));
          setIsLoading(false);
          return;
        }

        // 获取所有卡片信息以提取 sortField
        const allCardsInfo = await client.cardsInfo(dueCardIds);
        const cardList: CardListItem[] = allCardsInfo.map((card) => {
          // sortField 是 order=0 的字段
          const sortFieldEntry = Object.entries(card.fields).find(
            ([_, field]) => field.order === 0
          );
          const sortField = sortFieldEntry
            ? sortFieldEntry[1].value.replace(/<[^>]*>/g, "").trim()
            : t("study.unknown");

          return {
            cardId: card.cardId,
            sortField: sortField.substring(0, 100), // 限制长度
          };
        });

        const firstCard = allCardsInfo[0];

        setSession({
          query,
          cardQueue: dueCardIds,
          cardList,
          currentIndex: 0,
          currentCard: firstCard,
          showAnswer: false,
          answeredCardIds: new Set(),
          sessionStats: {
            total: dueCardIds.length,
            studied: 0,
            again: 0,
            hard: 0,
            good: 0,
            easy: 0,
          },
        });

        setIsSessionActive(true);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("study.errors.loadFailed"));
        setIsLoading(false);
      }
    },
    [client, t]
  );

  const showAnswer = useCallback(() => {
    if (!session) return;

    setSession({
      ...session,
      showAnswer: true,
    });
  }, [session]);

  const answerCard = useCallback(
    async (ease: number) => {
      if (!session || !client) return;

      setIsLoading(true);

      try {
        await client.answerCards([
          { cardId: session.currentCard!.cardId, ease },
        ]);

        const easeLabels = ["again", "hard", "good", "easy"] as const;
        const easeLabel = easeLabels[ease - 1];

        const newStats = {
          ...session.sessionStats,
          studied: session.sessionStats.studied + 1,
          [easeLabel]: session.sessionStats[easeLabel] + 1,
        };

        const newAnsweredCardIds = new Set(session.answeredCardIds);
        newAnsweredCardIds.add(session.currentCard!.cardId);

        if (session.currentIndex + 1 < session.cardQueue.length) {
          const nextCardId = session.cardQueue[session.currentIndex + 1];
          const nextCard = await client.cardInfo(nextCardId);

          setSession({
            ...session,
            currentIndex: session.currentIndex + 1,
            currentCard: nextCard,
            showAnswer: false,
            answeredCardIds: newAnsweredCardIds,
            sessionStats: newStats,
          });
        } else {
          setSession({
            ...session,
            currentCard: null,
            answeredCardIds: newAnsweredCardIds,
            sessionStats: newStats,
          });
        }

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("study.errors.answerFailed"));
        setIsLoading(false);
      }
    },
    [session, client, t]
  );

  const toggleFlag = useCallback(
    async (flag: number) => {
      if (!session || !session.currentCard || !client) return;

      console.log("[Study] Setting flag:", flag, "for card:", session.currentCard.cardId);

      try {
        await client.setCardFlag(session.currentCard.cardId, flag);
        console.log("[Study] Flag set successfully");

        const updatedCard = await client.cardInfo(session.currentCard.cardId);
        console.log("[Study] Card reloaded");

        setSession({
          ...session,
          currentCard: updatedCard,
        });

        const flagName = flag === 0 ? t("study.errors.flagNone") :
                        flag === 1 ? t("study.errors.flagRed") :
                        flag === 2 ? t("study.errors.flagOrange") :
                        flag === 3 ? t("study.errors.flagGreen") :
                        t("study.errors.flagBlue");
        setError(t("study.errors.flagSet", { flag: flagName }));
      } catch (err) {
        console.error("[Study] Set flag error:", err);
        setError(err instanceof Error ? err.message : t("study.errors.flagFailed"));
      }
    },
    [session, client, t]
  );

  const suspendCard = useCallback(async () => {
    if (!session || !session.currentCard || !client) return;

    try {
      await client.suspendCards([session.currentCard.cardId]);

      if (session.currentIndex + 1 < session.cardQueue.length) {
        const nextCardId = session.cardQueue[session.currentIndex + 1];
        const nextCard = await client.cardInfo(nextCardId);

        setSession({
          ...session,
          currentIndex: session.currentIndex + 1,
          currentCard: nextCard,
          showAnswer: false,
        });
      } else {
        setSession({
          ...session,
          currentCard: null,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("study.errors.suspendFailed"));
    }
  }, [session, client, t]);

  const buryCard = useCallback(async () => {
    if (!session || !session.currentCard || !client) return;

    try {
      await client.buryCards([session.currentCard.cardId]);

      if (session.currentIndex + 1 < session.cardQueue.length) {
        const nextCardId = session.cardQueue[session.currentIndex + 1];
        const nextCard = await client.cardInfo(nextCardId);

        setSession({
          ...session,
          currentIndex: session.currentIndex + 1,
          currentCard: nextCard,
          showAnswer: false,
        });
      } else {
        setSession({
          ...session,
          currentCard: null,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("study.errors.buryFailed"));
    }
  }, [session, client, t]);

  const jumpToCard = useCallback(
    async (index: number) => {
      if (!session || !client || index === session.currentIndex) return;

      setIsLoading(true);
      try {
        const cardId = session.cardQueue[index];
        const card = await client.cardInfo(cardId);

        setSession({
          ...session,
          currentIndex: index,
          currentCard: card,
          showAnswer: false,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : t("study.errors.loadFailed"));
      } finally {
        setIsLoading(false);
      }
    },
    [session, client, t]
  );

  const endSession = useCallback(() => {
    setIsSessionActive(false);
    setSession(null);
    setQueryInput("");
  }, []);


  useEffect(() => {
    if (connectionError || !isConnected) {
      setError(t("study.errors.connectionFailed"));
    }
  }, [connectionError, isConnected, t]);

  // 快捷键监听
  useEffect(() => {
    if (!session || !session.showAnswer || isLoading) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 检测 cmd (Mac) 或 ctrl (Windows)
      const modifierKey = e.metaKey || e.ctrlKey;

      if (!modifierKey) return;

      // 防止浏览器默认行为
      if (["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case "1":
          answerCard(1); // Again
          break;
        case "2":
          answerCard(2); // Hard
          break;
        case "3":
          answerCard(3); // Good
          break;
        case "4":
          answerCard(4); // Easy
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [session, isLoading, answerCard]);

  const renderToast = () => (
    <Toast.Provider swipeDirection="right">
      <Toast.Root
        open={toastOpen}
        onOpenChange={setToastOpen}
        duration={5000}
        style={{
          background: "var(--red-9)",
          color: "white",
          borderRadius: "var(--radius-3)",
          padding: "1rem 1.5rem",
          boxShadow:
            "0 10px 38px -10px rgba(22, 23, 24, 0.35), 0 10px 20px -15px rgba(22, 23, 24, 0.2)",
        }}
      >
        <Toast.Title style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
          {t("study.errors.title")}
        </Toast.Title>
        <Toast.Description>{error}</Toast.Description>
      </Toast.Root>
      <Toast.Viewport
        style={{
          position: "fixed",
          bottom: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          padding: "1.5rem",
          gap: "0.625rem",
          width: "390px",
          maxWidth: "100vw",
          margin: 0,
          listStyle: "none",
          zIndex: 2147483647,
          outline: "none",
        }}
      />
    </Toast.Provider>
  );

  if (!isSessionActive) {
    return (
      <>
        <Box p="6">
        <Flex direction="column" gap="6" maxWidth="600px" mx="auto">
          <Box>
            <Heading size="8" mb="2">
              {t("study.startTitle")}
            </Heading>
            <Text color="gray" size="3">
              {t("study.startSubtitle")}
            </Text>
          </Box>


          <Box>
            <Text as="label" size="2" weight="bold" mb="2">
              {t("study.queryLabel")}
            </Text>
            <TextField.Root
              size="3"
              placeholder={t("study.queryPlaceholder")}
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && queryInput.trim()) {
                  startSession(queryInput.trim());
                }
              }}
            />
            <Text size="1" color="gray" mt="1">
              {t("study.queryHint")}
            </Text>
          </Box>

          <Button
            size="3"
            onClick={() => startSession(queryInput.trim())}
            disabled={!queryInput.trim() || isLoading}
          >
            {isLoading ? t("study.loading") : t("study.startButton")}
          </Button>

          <Box>
            <Text size="2" weight="bold" mb="2">
              {t("study.exampleQueriesTitle")}
            </Text>
            <Flex direction="column" gap="2">
              <Card
                style={{ cursor: "pointer" }}
                onClick={() => setQueryInput("is:due")}
              >
                <Text size="2" weight="bold">
                  is:due
                </Text>
                <Text size="1" color="gray">
                  {t("study.exampleDue")}
                </Text>
              </Card>
              <Card
                style={{ cursor: "pointer" }}
                onClick={() => setQueryInput('deck:"Default"')}
              >
                <Text size="2" weight="bold">
                  deck:"Default"
                </Text>
                <Text size="1" color="gray">
                  {t("study.exampleDeck")}
                </Text>
              </Card>
              <Card
                style={{ cursor: "pointer" }}
                onClick={() => setQueryInput("is:new")}
              >
                <Text size="2" weight="bold">
                  is:new
                </Text>
                <Text size="1" color="gray">
                  {t("study.exampleNew")}
                </Text>
              </Card>
            </Flex>
          </Box>
        </Flex>
      </Box>
      {renderToast()}
      </>
    );
  }

  if (session && !session.currentCard) {
    return (
      <>
      <Box p="6">
        <Flex
          direction="column"
          gap="6"
          maxWidth="600px"
          mx="auto"
          align="center"
        >
          <CheckIcon width="64" height="64" color="green" />
          <Heading size="8">{t("study.completedTitle")}</Heading>

          <Card style={{ width: "100%" }}>
            <Flex direction="column" gap="3">
              <Text size="5" weight="bold">
                {t("study.statsTitle")}
              </Text>
              <Separator size="4" />
              <Flex justify="between">
                <Text>{t("study.statsTotal")}</Text>
                <Text weight="bold">{session.sessionStats.studied} {t("study.statsUnit")}</Text>
              </Flex>
              <Flex justify="between">
                <Text>{t("study.statsAgain")}</Text>
                <Text weight="bold" color="red">
                  {session.sessionStats.again}
                </Text>
              </Flex>
              <Flex justify="between">
                <Text>{t("study.statsHard")}</Text>
                <Text weight="bold" color="orange">
                  {session.sessionStats.hard}
                </Text>
              </Flex>
              <Flex justify="between">
                <Text>{t("study.statsGood")}</Text>
                <Text weight="bold" color="green">
                  {session.sessionStats.good}
                </Text>
              </Flex>
              <Flex justify="between">
                <Text>{t("study.statsEasy")}</Text>
                <Text weight="bold" color="blue">
                  {session.sessionStats.easy}
                </Text>
              </Flex>
              <Separator size="4" />
              <Flex justify="between">
                <Text>{t("study.statsRemaining")}</Text>
                <Text weight="bold">
                  {session.sessionStats.total - session.sessionStats.studied}
                </Text>
              </Flex>
            </Flex>
          </Card>

          <Button size="3" onClick={endSession}>
            {t("study.returnButton")}
          </Button>
        </Flex>
      </Box>
      {renderToast()}
      </>
    );
  }

  if (!session || !session.currentCard) {
    return null;
  }

  const { currentCard, showAnswer: isAnswerShown } = session;
  const progress = session.currentIndex + 1;
  const total = session.cardQueue.length;

  return (
    <>
    <Box p="6">
      <Flex gap="4" style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* 左侧：卡片学习区域 */}
        <Box style={{ flex: showCardList ? "0 0 70%" : "1" }}>
          <Flex direction="column" gap="4">
            <Flex justify="between" align="center">
              <Flex gap="3" align="center">
                <Badge size="2" color="blue">
                  {progress} / {total}
                </Badge>
                <Text size="2" color="gray">
                  {currentCard.modelName}
                </Text>
              </Flex>

              <Flex gap="2">
                <IconButton
                  variant="soft"
                  color="red"
                  title={t("study.flagRed")}
                  onClick={() => toggleFlag(1)}
                >
                  <BookmarkIcon />
                </IconButton>
                <IconButton
                  variant="soft"
                  color="orange"
                  title={t("study.suspendCard")}
                  onClick={suspendCard}
                >
                  <PauseIcon />
                </IconButton>
                <IconButton
                  variant="soft"
                  color="gray"
                  title={t("study.buryCard")}
                  onClick={buryCard}
                >
                  <EyeNoneIcon />
                </IconButton>
                <Button
                  variant="outline"
                  onClick={() => setShowCardList(!showCardList)}
                >
                  {showCardList ? t("study.hideList") : t("study.showList")}{t("study.list")}
                </Button>
                <Button variant="outline" onClick={endSession}>
                  {t("study.endSession")}
                </Button>
              </Flex>
            </Flex>

        <Card
          size="4"
          style={{
            maxHeight: "calc(100vh - 400px)",
            minHeight: "300px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Box
            style={{
              flex: 1,
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            {!isAnswerShown ? (
              <Box>
                <Text size="1" color="gray" mb="2">
                  {t("study.question")}
                </Text>
                <CardContent
                  html={currentCard.question}
                  css={currentCard.css}
                  autoPlayAudio={false}
                  cardInfo={currentCard}
                  className="card-question"
                  style={{
                    padding: "1rem",
                    fontSize: "1.1rem",
                    lineHeight: "1.6",
                  }}
                />
              </Box>
            ) : (
              <Box>
                <Text size="1" color="gray" mb="2">
                  {t("study.answer")}
                </Text>
                <CardContent
                  html={currentCard.answer}
                  css={currentCard.css}
                  autoPlayAudio={true}
                  cardInfo={currentCard}
                  className="card-answer"
                  style={{
                    padding: "1rem",
                    fontSize: "1.1rem",
                    lineHeight: "1.6",
                  }}
                />
              </Box>
            )}
          </Box>
        </Card>

        {!isAnswerShown ? (
          <Button size="4" onClick={showAnswer} disabled={isLoading}>
            {t("study.showAnswer")}
          </Button>
        ) : (
          <Flex gap="3" justify="center">
            <Button
              size="4"
              color="red"
              variant="soft"
              style={{ flex: 1 }}
              onClick={() => answerCard(1)}
              disabled={isLoading}
              title="Cmd/Ctrl + 1"
            >
              <Flex direction="column" align="center" gap="1">
                <Text weight="bold">{t("study.again")}</Text>
                <Text size="1">Again</Text>
              </Flex>
            </Button>
            <Button
              size="4"
              color="orange"
              variant="soft"
              style={{ flex: 1 }}
              onClick={() => answerCard(2)}
              disabled={isLoading}
              title="Cmd/Ctrl + 2"
            >
              <Flex direction="column" align="center" gap="1">
                <Text weight="bold">{t("study.hard")}</Text>
                <Text size="1">Hard</Text>
              </Flex>
            </Button>
            <Button
              size="4"
              color="green"
              variant="soft"
              style={{ flex: 1 }}
              onClick={() => answerCard(3)}
              disabled={isLoading}
              title="Cmd/Ctrl + 3"
            >
              <Flex direction="column" align="center" gap="1">
                <Text weight="bold">{t("study.good")}</Text>
                <Text size="1">Good</Text>
              </Flex>
            </Button>
            <Button
              size="4"
              color="blue"
              variant="soft"
              style={{ flex: 1 }}
              onClick={() => answerCard(4)}
              disabled={isLoading}
              title="Cmd/Ctrl + 4"
            >
              <Flex direction="column" align="center" gap="1">
                <Text weight="bold">{t("study.easy")}</Text>
                <Text size="1">Easy</Text>
              </Flex>
            </Button>
          </Flex>
        )}

        <Card>
          <Flex direction="column" gap="2">
            <Text size="2" weight="bold">
              {t("study.cardInfo")}
            </Text>
            <Flex gap="4" wrap="wrap">
              <Text size="2">
                <Text color="gray">{t("study.interval")}</Text>
                {currentCard.interval} {t("study.intervalUnit")}
              </Text>
              <Text size="2">
                <Text color="gray">{t("study.ease")}</Text>
                {currentCard.ease / 10}%
              </Text>
              <Text size="2">
                <Text color="gray">{t("study.reps")}</Text>
                {currentCard.reps}
              </Text>
              <Text size="2">
                <Text color="gray">{t("study.lapses")}</Text>
                {currentCard.lapses}
              </Text>
            </Flex>
            {currentCard.noteTags && currentCard.noteTags.length > 0 && (
              <Flex gap="2" wrap="wrap">
                {currentCard.noteTags.map((tag: string) => (
                  <Badge key={tag} variant="soft">
                    {tag}
                  </Badge>
                ))}
              </Flex>
            )}
          </Flex>
        </Card>
          </Flex>
        </Box>

        {/* 右侧：卡片列表 */}
        {showCardList && (
          <Box style={{ flex: "0 0 28%" }}>
            <Card style={{ position: "sticky", top: "1rem" }}>
              <Flex direction="column" gap="2">
                <Text size="3" weight="bold" mb="2">
                  {t("study.queueTitle")}
                </Text>
                <Text size="1" color="gray" mb="2">
                  {t("study.queueCount", { count: session.cardList.length })}
                </Text>
                <Box
                  style={{
                    maxHeight: "calc(100vh - 200px)",
                    overflowY: "auto",
                    overflowX: "hidden",
                  }}
                >
                  {session.cardList.map((item, index) => {
                    const isAnswered = session.answeredCardIds.has(item.cardId);
                    const isCurrent = index === session.currentIndex;

                    return (
                      <Box
                        key={item.cardId}
                        p="2"
                        mb="1"
                        style={{
                          backgroundColor: isCurrent
                            ? "var(--accent-3)"
                            : "transparent",
                          borderRadius: "var(--radius-2)",
                          cursor: "pointer",
                          transition: "background-color 0.2s",
                          border: isCurrent
                            ? "1px solid var(--accent-7)"
                            : "1px solid transparent",
                        }}
                        onClick={() => jumpToCard(index)}
                        onMouseEnter={(e) => {
                          if (!isCurrent) {
                            e.currentTarget.style.backgroundColor =
                              "var(--gray-3)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isCurrent) {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }
                        }}
                      >
                        <Flex gap="2" align="center">
                          <Badge
                            size="1"
                            color={
                              isAnswered
                                ? "green"
                                : isCurrent
                                ? "blue"
                                : "gray"
                            }
                            variant="soft"
                          >
                            {index + 1}
                          </Badge>
                          <Text
                            size="2"
                            style={{
                              flex: 1,
                              color: isCurrent
                                ? "var(--accent-11)"
                                : isAnswered
                                ? "var(--gray-10)"
                                : "var(--gray-12)",
                              fontWeight: isCurrent ? 600 : 400,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.sortField || t("study.unknown")}
                          </Text>
                          {isAnswered && (
                            <Text size="1" color="green">
                              ✓
                            </Text>
                          )}
                          {isCurrent && (
                            <Text size="2" color="blue">
                              ▶
                            </Text>
                          )}
                        </Flex>
                      </Box>
                    );
                  })}
                </Box>
              </Flex>
            </Card>
          </Box>
        )}
      </Flex>
    </Box>
    {renderToast()}
    </>
  );
}
