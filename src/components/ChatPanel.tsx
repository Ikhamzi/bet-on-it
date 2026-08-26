import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { theme } from "../theme/colors";
import type { ChatMessage } from "../services/rooms";

interface Props {
  messages: ChatMessage[];
  myUid: string;
  onSend: (text: string) => void;
  onClose: () => void;
}

export default function ChatPanel({ messages, myUid, onSend, onClose }: Props) {
  const [text, setText] = useState("");
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  }, [messages.length]);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText("");
  };

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.panel}
      >
        <View style={styles.header}>
          <Text style={styles.title}>💬 Room chat</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.empty}>No messages yet — say hi 👋</Text>}
          renderItem={({ item }) => {
            const mine = item.uid === myUid;
            return (
              <View style={[styles.row, mine && styles.rowMine]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                  {!mine && <Text style={styles.sender}>{item.name}</Text>}
                  <Text style={[styles.text, mine && styles.textMine]}>{item.text}</Text>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.inputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Say something…"
            placeholderTextColor={theme.textMuted}
            style={styles.input}
            maxLength={300}
            onSubmitEditing={submit}
            returnKeyType="send"
          />
          <Pressable style={styles.sendBtn} onPress={submit} disabled={!text.trim()}>
            <Text style={styles.sendBtnText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  panel: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    height: "60%",
    padding: 16,
    gap: 10,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: theme.text, fontWeight: "800", fontSize: 16 },
  close: { color: theme.textMuted, fontSize: 18, fontWeight: "700" },
  list: { flex: 1 },
  listContent: { gap: 8, paddingVertical: 8 },
  empty: { color: theme.textMuted, textAlign: "center", marginTop: 20, fontStyle: "italic" },
  row: { flexDirection: "row" },
  rowMine: { justifyContent: "flex-end" },
  bubble: { maxWidth: "78%", borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12 },
  bubbleOther: { backgroundColor: theme.surfaceAlt, borderBottomLeftRadius: 4 },
  bubbleMine: { backgroundColor: theme.accent, borderBottomRightRadius: 4 },
  sender: { color: theme.accent, fontSize: 11, fontWeight: "700", marginBottom: 2 },
  text: { color: theme.text, fontSize: 14 },
  textMine: { color: "#0F1220" },
  inputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    color: theme.text,
  },
  sendBtn: {
    backgroundColor: theme.accent,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  sendBtnText: { color: "#0F1220", fontWeight: "800" },
});
