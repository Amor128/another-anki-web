import type { Route } from "./+types/add-note";
import { useState } from "react";
import { Box, Button, Flex, Heading, Text, TextField, Select, Callout } from "@radix-ui/themes";
import { InfoCircledIcon, CheckIcon } from "@radix-ui/react-icons";
import { useAnkiConnect, useModels, useDeckNames } from "../lib/useAnkiConnect";
import { AnkiConnectError } from "../lib/ankiconnect";
import { useTranslation } from "react-i18next";

export const meta: Route.MetaFunction = () => [
  { title: "Add Note - Anki Web" },
  { name: "description", content: "Add a new note to your Anki deck" },
];

export default function AddNotePage() {
  const { t } = useTranslation();
  const { client, isConnected, error: connectionError } = useAnkiConnect();
  const modelsState = useModels();
  const { data: deckNames, isLoading: decksLoading, error: decksError } = useDeckNames();

  // Form state
  const [selectedDeck, setSelectedDeck] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [tags, setTags] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Get field names for the selected model
  const getFieldNamesForModel = () => {
    const model = modelsState.models.find((m) => m.name === selectedModel);
    if (!model || !model.flds) return [];
    return model.flds.map((field: any) => field.name);
  };

  const fieldNames = getFieldNamesForModel();

  // Update field value
  const handleFieldChange = (fieldName: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    // Validation
    if (!selectedDeck) {
      setSubmitError(t("addNote.validation.selectDeck"));
      return;
    }

    if (!selectedModel) {
      setSubmitError(t("addNote.validation.selectModel"));
      return;
    }

    // Check if all fields are filled
    if (fieldNames.some((fieldName: string) => !fieldValues[fieldName]?.trim())) {
      setSubmitError(t("addNote.validation.fillAllFields"));
      return;
    }

    setIsSubmitting(true);

    try {
      const noteId = await client.addNote(selectedDeck, selectedModel, fieldValues, {
        tags: tags
          .split(" ")
          .filter((tag) => tag.trim())
          .map((tag) => tag.trim()),
      });

      setSubmitSuccess(true);
      // Reset form
      setFieldValues({});
      setTags("");

      // Show success message for 3 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);

      console.log("Note created with ID:", noteId);
    } catch (error) {
      if (error instanceof AnkiConnectError) {
        setSubmitError(error.message);
      } else {
        setSubmitError(t("addNote.error"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if form is valid
  const isFormValid =
    selectedDeck &&
    selectedModel &&
    fieldNames.length > 0 &&
    fieldNames.every((fieldName: string) => fieldValues[fieldName]?.trim());

  if (!isConnected) {
    return (
      <Box p="6" className="h-full overflow-y-auto">
        <Flex direction="column" gap="4" className="max-w-2xl mx-auto pt-8">
          <Heading>{t("addNote.title")}</Heading>
          <Callout.Root color="red">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              {connectionError?.message || t("connectionError.message")}
            </Callout.Text>
          </Callout.Root>
        </Flex>
      </Box>
    );
  }

  return (
    <Box p="6" className="h-full overflow-y-auto">
      <Flex direction="column" gap="6" className="max-w-2xl mx-auto pt-4">
        <Heading size="8">{t("addNote.title")}</Heading>

        {submitError && (
          <Callout.Root color="red">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>{submitError}</Callout.Text>
          </Callout.Root>
        )}

        {submitSuccess && (
          <Callout.Root color="green">
            <Callout.Icon>
              <CheckIcon />
            </Callout.Icon>
            <Callout.Text>{t("addNote.successMessage")}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="6">
            {/* Deck Selection */}
            <Flex direction="column" gap="2">
              <label htmlFor="deck-select" className="text-sm font-medium">
                {t("addNote.deck")} <span className="text-red-500">*</span>
              </label>
              <Select.Root value={selectedDeck} onValueChange={setSelectedDeck}>
                <Select.Trigger id="deck-select" placeholder={t("addNote.selectDeck")} />
                <Select.Content>
                  <Select.Group>
                    {!decksLoading && !decksError && deckNames && deckNames.length > 0 && (
                      deckNames.map((deckName) => (
                        <Select.Item key={deckName} value={deckName}>
                          {deckName}
                        </Select.Item>
                      ))
                    )}
                    {decksLoading && (
                      <Text size="2" color="gray" className="p-2">
                        {t("addNote.loadingDecks")}
                      </Text>
                    )}
                    {decksError && (
                      <Text size="2" color="red" className="p-2">
                        {t("addNote.errorLoadingDecks")}
                      </Text>
                    )}
                    {deckNames && deckNames.length === 0 && !decksLoading && (
                      <Text size="2" color="gray" className="p-2">
                        {t("addNote.noDeckAvailable")}
                      </Text>
                    )}
                  </Select.Group>
                </Select.Content>
              </Select.Root>
            </Flex>

            {/* Model Selection */}
            <Flex direction="column" gap="2">
              <label htmlFor="model-select" className="text-sm font-medium">
                {t("addNote.noteType")} <span className="text-red-500">*</span>
              </label>
              <Select.Root value={selectedModel} onValueChange={setSelectedModel}>
                <Select.Trigger id="model-select" placeholder={t("addNote.selectNoteType")} />
                <Select.Content>
                  <Select.Group>
                    {modelsState.models.length > 0 && (
                      modelsState.models.map((model) => (
                        <Select.Item key={model.id} value={model.name}>
                          {model.name}
                        </Select.Item>
                      ))
                    )}
                    {modelsState.models.length === 0 && (
                      <Text size="2" color="gray" className="p-2">
                        {t("addNote.noModelsAvailable")}
                      </Text>
                    )}
                  </Select.Group>
                </Select.Content>
              </Select.Root>
            </Flex>

            {/* Field Inputs */}
            {fieldNames.length > 0 && (
              <Flex direction="column" gap="4">
                <Text weight="medium">{t("addNote.fields")}</Text>
                {fieldNames.map((fieldName: string) => (
                  <Flex key={fieldName} direction="column" gap="2">
                    <label htmlFor={fieldName} className="text-sm font-medium">
                      {fieldName} <span className="text-red-500">*</span>
                    </label>
                    <TextField.Root
                      id={fieldName}
                      placeholder={`${t("common.search")} ${fieldName}...`}
                      value={fieldValues[fieldName] || ""}
                      onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                    />
                  </Flex>
                ))}
              </Flex>
            )}

            {/* Tags Input */}
            <Flex direction="column" gap="2">
              <label htmlFor="tags" className="text-sm font-medium">
                {t("addNote.tags")}
              </label>
              <TextField.Root
                id="tags"
                placeholder={t("addNote.tagsPlaceholder")}
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <Text size="1" color="gray">
                {t("addNote.tagsHint")}
              </Text>
            </Flex>

            {/* Submit Button */}
            <Flex gap="3" mt="4">
              <Button type="submit" disabled={!isFormValid || isSubmitting} size="2">
                {isSubmitting ? t("addNote.creating") : t("addNote.createButton")}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Flex>
    </Box>
  );
}
