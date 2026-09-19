import React from 'react';
import { StyleSheet, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { DESIGN_TOKENS } from '../types/design';

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
});

const markdownStyles = {
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: DESIGN_TOKENS.colors.text.primary,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 8,
  },
  strong: {
    fontWeight: 'bold' as const,
  },
  em: {
    fontStyle: 'italic' as const,
  },
  heading1: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    marginTop: 12,
    marginBottom: 6,
    color: DESIGN_TOKENS.colors.text.primary,
  },
  heading2: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginTop: 10,
    marginBottom: 6,
    color: DESIGN_TOKENS.colors.text.primary,
  },
  heading3: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginTop: 8,
    marginBottom: 4,
    color: DESIGN_TOKENS.colors.text.primary,
  },
  code_inline: {
    fontFamily: 'monospace',
    fontSize: 13,
    backgroundColor: 'rgba(255, 199, 44, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    color: DESIGN_TOKENS.colors.primary,
  },
  fence: {
    fontFamily: 'monospace',
    fontSize: 13,
    backgroundColor: '#1b1b1d',
    color: '#F4F4F6',
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border.hairline,
  },
  code_block: {
    fontFamily: 'monospace',
    fontSize: 13,
    backgroundColor: '#1b1b1d',
    color: '#F4F4F6',
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: DESIGN_TOKENS.colors.primary,
    paddingLeft: 12,
    marginVertical: 6,
    opacity: 0.9,
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  list_item: {
    marginVertical: 2,
  },
  link: {
    color: DESIGN_TOKENS.colors.primary,
    textDecorationLine: 'underline' as const,
  },
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  if (!content) return null;

  return (
    <View style={styles.container}>
      <Markdown style={markdownStyles}>{content}</Markdown>
    </View>
  );
};

export default MarkdownRenderer;