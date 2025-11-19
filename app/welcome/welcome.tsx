import { Link } from "react-router";
import { FileTextIcon } from "@radix-ui/react-icons";
import { useTranslation } from "react-i18next";
import { Box, Flex, Heading, Text, Grid, Card } from "@radix-ui/themes";

export function Welcome() {
  const { t } = useTranslation();

  return (
    <Box
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      <Flex flexGrow="1" align="center" justify="center">
        <Box
          style={{
            maxWidth: "768px",
            margin: "0 auto",
            padding: "3rem 1.5rem",
          }}
        >
          <Heading size="9" mb="4" style={{ color: "var(--gray-12)" }}>
            {t("home.title")}
          </Heading>
          <Text size="5" mb="6" style={{ color: "var(--gray-11)" }}>
            {t("home.subtitle")}
          </Text>

          {/* Quick Actions */}
          <Grid columns={{ initial: "1", md: "2" }} gap="4" mb="6">
            <Link to="/browser" style={{ textDecoration: "none" }}>
              <Card
                style={{
                  padding: "1.5rem",
                  background: "var(--accent-3)",
                  border: "2px solid var(--accent-6)",
                  borderRadius: "var(--radius-3)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-8)";
                  e.currentTarget.style.background = "var(--accent-4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-6)";
                  e.currentTarget.style.background = "var(--accent-3)";
                }}
              >
                <Flex align="center" gap="4">
                  <Box
                    style={{
                      padding: "0.75rem",
                      background: "var(--accent-9)",
                      color: "white",
                      borderRadius: "var(--radius-2)",
                    }}
                  >
                    <FileTextIcon style={{ width: "24px", height: "24px" }} />
                  </Box>
                  <Box>
                    <Text
                      weight="bold"
                      size="4"
                      style={{ color: "var(--gray-12)" }}
                    >
                      {t("home.browserTitle")}
                    </Text>
                    <Text size="2" style={{ color: "var(--gray-11)" }}>
                      {t("home.browserDescription")}
                    </Text>
                  </Box>
                </Flex>
              </Card>
            </Link>

            <Link to="/add-note" style={{ textDecoration: "none" }}>
              <Card
                style={{
                  padding: "1.5rem",
                  background: "var(--green-3)",
                  border: "2px solid var(--green-6)",
                  borderRadius: "var(--radius-3)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--green-8)";
                  e.currentTarget.style.background = "var(--green-4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--green-6)";
                  e.currentTarget.style.background = "var(--green-3)";
                }}
              >
                <Flex align="center" gap="4">
                  <Box
                    style={{
                      padding: "0.75rem",
                      background: "var(--green-9)",
                      color: "white",
                      borderRadius: "var(--radius-2)",
                    }}
                  >
                    <FileTextIcon style={{ width: "24px", height: "24px" }} />
                  </Box>
                  <Box>
                    <Text
                      weight="bold"
                      size="4"
                      style={{ color: "var(--gray-12)" }}
                    >
                      {t("home.addNoteTitle")}
                    </Text>
                    <Text size="2" style={{ color: "var(--gray-11)" }}>
                      {t("home.addNoteDescription")}
                    </Text>
                  </Box>
                </Flex>
              </Card>
            </Link>
          </Grid>

          {/* Features */}
          <Card
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--gray-6)",
              borderRadius: "var(--radius-3)",
              padding: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            <Heading size="5" mb="4" style={{ color: "var(--gray-12)" }}>
              {t("home.featuresTitle")}
            </Heading>
            <Box
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {(t("home.features", { returnObjects: true }) as string[]).map(
                (feature: string, index: number) => (
                  <Flex key={index} align="center" gap="3">
                    <Text weight="bold" style={{ color: "var(--accent-9)" }}>
                      ✓
                    </Text>
                    <Text style={{ color: "var(--gray-11)" }}>{feature}</Text>
                  </Flex>
                )
              )}
            </Box>
          </Card>

          {/* Requirements */}
          <Card
            style={{
              background: "var(--amber-3)",
              border: "1px solid var(--amber-6)",
              borderRadius: "var(--radius-3)",
              padding: "1.5rem",
            }}
          >
            <Heading size="4" mb="3" style={{ color: "var(--amber-11)" }}>
              {t("home.requirementsTitle")}
            </Heading>
            <Box
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {(
                t("home.requirements", { returnObjects: true }) as string[]
              ).map((requirement: string, index: number) => (
                <Text key={index} size="2" style={{ color: "var(--amber-11)" }}>
                  {index === 1 ? (
                    <>
                      • {requirement.split("(download)")[0]}
                      <a
                        href="https://ankiweb.net/shared/info/2055492159"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          textDecoration: "underline",
                          fontWeight: "500",
                          color: "var(--amber-11)",
                        }}
                      >
                        (download)
                      </a>
                    </>
                  ) : (
                    <>• {requirement}</>
                  )}
                </Text>
              ))}
            </Box>
          </Card>
        </Box>
      </Flex>
    </Box>
  );
}
