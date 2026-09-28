import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

// Ultra-light line glyphs drawn with pure React Native Views + transforms
// (zero external icon fonts or emoji — 100% consistent across iOS & Android 8+).

export interface GlyphProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

interface GlyphWrapProps extends GlyphProps {
  children: ((props: { color: string; stroke: number; size: number }) => React.ReactNode) | React.ReactNode;
}

export const GlyphWrap = ({ size = 20, color = '#F4F4F6', style, children }: GlyphWrapProps) => {
  const stroke = Math.max(1.2, Number((size / 14).toFixed(1)));
  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      {typeof children === 'function' ? children({ color, stroke, size }) : children}
    </View>
  );
};

// ── Sparkles / auto_awesome (Stitch: "What can you do?") ─────────
export const SparklesGlyph = ({ size = 18, color = '#FFC72C', style }: GlyphProps) => (
  <GlyphWrap size={size} color={color} style={style}>
    {({ color: c, stroke }) => (
      <>
        {/* Main 4-point star vertical diamond */}
        <View
          style={{
            position: 'absolute',
            top: '15%',
            left: '38%',
            width: '24%',
            height: '65%',
            borderRadius: stroke,
            backgroundColor: c,
            transform: [{ rotate: '0deg' }],
          }}
        />
        {/* Main 4-point star horizontal diamond */}
        <View
          style={{
            position: 'absolute',
            top: '36%',
            left: '17%',
            width: '65%',
            height: '24%',
            borderRadius: stroke,
            backgroundColor: c,
            transform: [{ rotate: '0deg' }],
          }}
        />
        {/* Secondary mini sparkle top right */}
        <View
          style={{
            position: 'absolute',
            top: '8%',
            right: '10%',
            width: stroke * 2.2,
            height: stroke * 2.2,
            borderRadius: stroke,
            backgroundColor: c,
          }}
        />
        {/* Tertiary micro sparkle bottom left */}
        <View
          style={{
            position: 'absolute',
            bottom: '12%',
            left: '10%',
            width: stroke * 1.5,
            height: stroke * 1.5,
            borderRadius: stroke,
            backgroundColor: c,
          }}
        />
      </>
    )}
  </GlyphWrap>
);

// ── Edit Note / pencil (Stitch: "Help me write something") ────────
export const EditNoteGlyph = ({ size = 18, color = '#FFC72C', style }: GlyphProps) => (
  <GlyphWrap size={size} color={color} style={style}>
    {({ color: c, stroke }) => (
      <>
        {/* Notepad lines */}
        <View
          style={{
            position: 'absolute',
            top: '20%',
            left: '15%',
            width: '45%',
            height: stroke,
            backgroundColor: c,
            borderRadius: 1,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: '40%',
            left: '15%',
            width: '40%',
            height: stroke,
            backgroundColor: c,
            borderRadius: 1,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: '60%',
            left: '15%',
            width: '30%',
            height: stroke,
            backgroundColor: c,
            borderRadius: 1,
          }}
        />
        {/* Pencil angled top right to bottom center */}
        <View
          style={{
            position: 'absolute',
            top: '20%',
            right: '16%',
            width: stroke * 1.6,
            height: '60%',
            backgroundColor: c,
            borderRadius: stroke,
            transform: [{ rotate: '-45deg' }],
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: '16%',
            right: '30%',
            width: stroke * 2,
            height: stroke * 2,
            backgroundColor: c,
            borderRadius: 1,
          }}
        />
      </>
    )}
  </GlyphWrap>
);

// ── Lightbulb (Stitch: "Explain a topic") ─────────────────────────
export const LightbulbGlyph = ({ size = 18, color = '#FFC72C', style }: GlyphProps) => (
  <GlyphWrap size={size} color={color} style={style}>
    {({ color: c, stroke }) => (
      <>
        {/* Bulb round head */}
        <View
          style={{
            position: 'absolute',
            top: '12%',
            left: '26%',
            width: '48%',
            height: '48%',
            borderRadius: 999,
            borderWidth: stroke,
            borderColor: c,
          }}
        />
        {/* Bulb inner filament dot */}
        <View
          style={{
            position: 'absolute',
            top: '30%',
            left: '44%',
            width: stroke * 1.6,
            height: stroke * 1.6,
            borderRadius: 999,
            backgroundColor: c,
          }}
        />
        {/* Base socket ribs */}
        <View
          style={{
            position: 'absolute',
            bottom: '26%',
            left: '36%',
            width: '28%',
            height: stroke,
            backgroundColor: c,
            borderRadius: 1,
          }}
        />
        <View
          style={{
            position: 'absolute',
            bottom: '16%',
            left: '40%',
            width: '20%',
            height: stroke,
            backgroundColor: c,
            borderRadius: 1,
          }}
        />
      </>
    )}
  </GlyphWrap>
);

// ── Summarize / Document (Stitch: "Summarize this text") ──────────
export const SummarizeGlyph = ({ size = 18, color = '#FFC72C', style }: GlyphProps) => (
  <GlyphWrap size={size} color={color} style={style}>
    {({ color: c, stroke }) => (
      <>
        {/* Document sheet border */}
        <View
          style={{
            position: 'absolute',
            top: '12%',
            left: '22%',
            width: '56%',
            height: '76%',
            borderRadius: 3,
            borderWidth: stroke,
            borderColor: c,
          }}
        />
        {/* Content text lines */}
        <View
          style={{
            position: 'absolute',
            top: '32%',
            left: '34%',
            width: '32%',
            height: stroke,
            backgroundColor: c,
            borderRadius: 1,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: '48%',
            left: '34%',
            width: '32%',
            height: stroke,
            backgroundColor: c,
            borderRadius: 1,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: '64%',
            left: '34%',
            width: '20%',
            height: stroke,
            backgroundColor: c,
            borderRadius: 1,
          }}
        />
      </>
    )}
  </GlyphWrap>
);

// ── Chevron Right (Stitch suggestion item right arrow) ────────────
export const ChevronGlyph = ({ size = 16, color = '#9E9EA7', style }: GlyphProps) => (
  <GlyphWrap size={size} color={color} style={style}>
    {({ color: c, stroke }) => (
      <>
        <View
          style={{
            position: 'absolute',
            top: '28%',
            left: '38%',
            width: '36%',
            height: stroke,
            backgroundColor: c,
            borderRadius: 1,
            transform: [{ rotate: '45deg' }],
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: '56%',
            left: '38%',
            width: '36%',
            height: stroke,
            backgroundColor: c,
            borderRadius: 1,
            transform: [{ rotate: '-45deg' }],
          }}
        />
      </>
    )}
  </GlyphWrap>
);

// ── Paperclip / attach_file (Stitch chat input left icon) ─────────
export const PaperclipGlyph = ({ size = 20, color = '#9E9EA7', style }: GlyphProps) => (
  <GlyphWrap size={size} color={color} style={style}>
    {({ color: c, stroke }) => (
      <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '45deg' }] }}>
        {/* Outer loop */}
        <View
          style={{
            width: '42%',
            height: '70%',
            borderRadius: 999,
            borderWidth: stroke,
            borderColor: c,
            borderBottomWidth: 0,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}
        />
        {/* Inner loop */}
        <View
          style={{
            position: 'absolute',
            top: '28%',
            width: '22%',
            height: '48%',
            borderRadius: 999,
            borderWidth: stroke,
            borderColor: c,
            borderTopWidth: 0,
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          }}
        />
      </View>
    )}
  </GlyphWrap>
);

// ── Diagonal Arrow / arrow_outward (Stitch send button icon) ──────
export const DiagonalArrowGlyph = ({ size = 18, color = '#1A1400', style }: GlyphProps) => (
  <GlyphWrap size={size} color={color} style={style}>
    {({ color: c, stroke }) => {
      const boldStroke = Math.max(1.8, stroke * 1.3);
      return (
        <>
          {/* Arrow horizontal bar at top right */}
          <View
            style={{
              position: 'absolute',
              top: '24%',
              right: '24%',
              width: '42%',
              height: boldStroke,
              backgroundColor: c,
              borderRadius: 1,
            }}
          />
          {/* Arrow vertical bar at top right */}
          <View
            style={{
              position: 'absolute',
              top: '24%',
              right: '24%',
              width: boldStroke,
              height: '42%',
              backgroundColor: c,
              borderRadius: 1,
            }}
          />
          {/* Diagonal stem */}
          <View
            style={{
              position: 'absolute',
              top: '46%',
              left: '26%',
              width: '50%',
              height: boldStroke,
              backgroundColor: c,
              borderRadius: 1,
              transform: [{ rotate: '-45deg' }],
            }}
          />
        </>
      );
    }}
  </GlyphWrap>
);

// ── Lock (Stitch footer: End-to-end encrypted session) ────────────
export const LockGlyph = ({ size = 13, color = '#9E9EA7', style }: GlyphProps) => (
  <GlyphWrap size={size} color={color} style={style}>
    {({ color: c, stroke }) => (
      <>
        {/* Shackle arch */}
        <View
          style={{
            position: 'absolute',
            top: '10%',
            left: '28%',
            width: '44%',
            height: '42%',
            borderTopLeftRadius: 999,
            borderTopRightRadius: 999,
            borderWidth: stroke,
            borderColor: c,
            borderBottomWidth: 0,
          }}
        />
        {/* Lock body container */}
        <View
          style={{
            position: 'absolute',
            bottom: '12%',
            left: '20%',
            width: '60%',
            height: '48%',
            borderRadius: 2.5,
            borderWidth: stroke,
            borderColor: c,
            backgroundColor: 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Keyhole dot */}
          <View
            style={{
              width: stroke * 1.4,
              height: stroke * 1.4,
              borderRadius: 999,
              backgroundColor: c,
            }}
          />
        </View>
      </>
    )}
  </GlyphWrap>
);

// ── Legacy Glyphs for backward compatibility ─────────────────────
export const ChatGlyph = ({ size = 20, color = '#F4F4F6', style }: GlyphProps) => (
  <GlyphWrap size={size} color={color} style={style}>
    {({ color: c, stroke }) => (
      <View
        style={{
          width: '76%',
          height: '64%',
          borderRadius: 8,
          borderWidth: stroke,
          borderColor: c,
        }}
      />
    )}
  </GlyphWrap>
);

export const HistoryGlyph = ({ size = 20, color = '#F4F4F6', style }: GlyphProps) => (
  <GlyphWrap size={size} color={color} style={style}>
    {({ color: c, stroke }) => (
      <View
        style={{
          width: '80%',
          height: '80%',
          borderRadius: 999,
          borderWidth: stroke,
          borderColor: c,
        }}
      />
    )}
  </GlyphWrap>
);

export const SettingsGlyph = ({ size = 20, color = '#F4F4F6', style }: GlyphProps) => (
  <GlyphWrap size={size} color={color} style={style}>
    {({ color: c, stroke }) => (
      <View
        style={{
          width: '75%',
          height: '75%',
          borderRadius: 999,
          borderWidth: stroke,
          borderColor: c,
        }}
      />
    )}
  </GlyphWrap>
);

export const SendGlyph = DiagonalArrowGlyph;
export const SparkleGlyph = SparklesGlyph;

export const CloseGlyph = ({ size = 14, color = '#F4F4F6', style }: GlyphProps) => (
  <GlyphWrap size={size} color={color} style={style}>
    {({ color: c, stroke }) => (
      <>
        <View
          style={{
            position: 'absolute',
            top: '50%',
            left: '15%',
            width: '70%',
            height: stroke,
            backgroundColor: c,
            borderRadius: 1,
            transform: [{ rotate: '45deg' }],
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: '50%',
            left: '15%',
            width: '70%',
            height: stroke,
            backgroundColor: c,
            borderRadius: 1,
            transform: [{ rotate: '-45deg' }],
          }}
        />
      </>
    )}
  </GlyphWrap>
);

export const TrashGlyph = ({ size = 14, color = '#EF4444', style }: GlyphProps) => (
  <GlyphWrap size={size} color={color} style={style}>
    {({ color: c, stroke }) => (
      <View
        style={{
          width: '60%',
          height: '70%',
          borderRadius: 2,
          borderWidth: stroke,
          borderColor: c,
        }}
      />
    )}
  </GlyphWrap>
);

// ── Hamburger (Sidebar Drawer Open) ──────────────────────────────
export const HamburgerGlyph = ({ size = 20, color = '#F4F4F6', style }: GlyphProps) => (
  <GlyphWrap size={size} color={color} style={style}>
    {({ color: c, stroke }) => (
      <>
        <View
          style={{
            position: 'absolute',
            top: '24%',
            left: '12%',
            width: '76%',
            height: Math.max(1.8, stroke),
            backgroundColor: c,
            borderRadius: 1,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: '48%',
            left: '12%',
            width: '76%',
            height: Math.max(1.8, stroke),
            backgroundColor: c,
            borderRadius: 1,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: '72%',
            left: '12%',
            width: '76%',
            height: Math.max(1.8, stroke),
            backgroundColor: c,
            borderRadius: 1,
          }}
        />
      </>
    )}
  </GlyphWrap>
);

// ── Plus (New Chat Action) ───────────────────────────────────────
export const PlusGlyph = ({ size = 18, color = '#F4F4F6', style }: GlyphProps) => (
  <GlyphWrap size={size} color={color} style={style}>
    {({ color: c, stroke }) => (
      <>
        <View
          style={{
            position: 'absolute',
            top: '48%',
            left: '18%',
            width: '64%',
            height: Math.max(1.8, stroke),
            backgroundColor: c,
            borderRadius: 1,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: '18%',
            left: '48%',
            width: Math.max(1.8, stroke),
            height: '64%',
            backgroundColor: c,
            borderRadius: 1,
          }}
        />
      </>
    )}
  </GlyphWrap>
);

// ── Back Chevron (Navigate Back) ──────────────────────────────────
export const BackChevronGlyph = ({ size = 18, color = '#F4F4F6', style }: GlyphProps) => (
  <GlyphWrap size={size} color={color} style={style}>
    {({ color: c, stroke }) => (
      <>
        <View
          style={{
            position: 'absolute',
            top: '36%',
            left: '28%',
            width: '44%',
            height: Math.max(1.8, stroke),
            backgroundColor: c,
            borderRadius: 1,
            transform: [{ rotate: '-45deg' }],
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: '60%',
            left: '28%',
            width: '44%',
            height: Math.max(1.8, stroke),
            backgroundColor: c,
            borderRadius: 1,
            transform: [{ rotate: '45deg' }],
          }}
        />
      </>
    )}
  </GlyphWrap>
);

// ── Copy (Clipboard Action) ──────────────────────────────────────
export const CopyGlyph = ({ size = 16, color = '#9E9EA7', style }: GlyphProps) => (
  <GlyphWrap size={size} color={color} style={style}>
    {({ color: c, stroke }) => (
      <>
        {/* Back document sheet */}
        <View
          style={{
            position: 'absolute',
            top: '12%',
            right: '12%',
            width: '54%',
            height: '62%',
            borderRadius: 3,
            borderWidth: Math.max(1.2, stroke * 0.9),
            borderColor: c,
            opacity: 0.6,
          }}
        />
        {/* Front document sheet */}
        <View
          style={{
            position: 'absolute',
            bottom: '12%',
            left: '12%',
            width: '56%',
            height: '64%',
            borderRadius: 3,
            borderWidth: Math.max(1.2, stroke),
            borderColor: c,
            backgroundColor: '#201f21',
          }}
        />
      </>
    )}
  </GlyphWrap>
);

// ── Check (Copied / Success Action) ──────────────────────────────
export const CheckGlyph = ({ size = 16, color = '#10B981', style }: GlyphProps) => (
  <GlyphWrap size={size} color={color} style={style}>
    {({ color: c, stroke }) => (
      <>
        {/* Short left arm */}
        <View
          style={{
            position: 'absolute',
            bottom: '30%',
            left: '16%',
            width: '32%',
            height: Math.max(1.8, stroke * 1.1),
            backgroundColor: c,
            borderRadius: 1,
            transform: [{ rotate: '45deg' }],
          }}
        />
        {/* Long right arm */}
        <View
          style={{
            position: 'absolute',
            bottom: '40%',
            right: '14%',
            width: '58%',
            height: Math.max(1.8, stroke * 1.1),
            backgroundColor: c,
            borderRadius: 1,
            transform: [{ rotate: '-50deg' }],
          }}
        />
      </>
    )}
  </GlyphWrap>
);

// ── Search (Sidebar search action) ───────────────────────────────
export const SearchGlyph = ({ size = 18, color = '#9E9EA7', style }: GlyphProps) => (
  <GlyphWrap size={size} color={color} style={style}>
    {({ color: c, stroke }) => {
      const thickness = Math.max(1.6, stroke);
      return (
        <>
          <View
            style={{
              position: 'absolute',
              top: '10%',
              left: '8%',
              width: '58%',
              height: '58%',
              borderRadius: 999,
              borderWidth: thickness,
              borderColor: c,
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: '16%',
              right: '12%',
              width: '34%',
              height: thickness,
              backgroundColor: c,
              borderRadius: 1,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </>
      );
    }}
  </GlyphWrap>
);

// ── Folder (Projects section) ────────────────────────────────────
export const FolderGlyph = ({ size = 18, color = '#9E9EA7', style }: GlyphProps) => (
  <GlyphWrap size={size} color={color} style={style}>
    {({ color: c, stroke }) => {
      const thickness = Math.max(1.4, stroke);
      return (
        <>
          {/* Folder tab */}
          <View
            style={{
              position: 'absolute',
              top: '10%',
              left: '12%',
              width: '34%',
              height: '14%',
              borderTopLeftRadius: 3,
              borderTopRightRadius: 3,
              borderWidth: thickness,
              borderColor: c,
              borderBottomWidth: 0,
            }}
          />
          {/* Folder body */}
          <View
            style={{
              position: 'absolute',
              top: '22%',
              left: '10%',
              width: '80%',
              height: '60%',
              borderRadius: 3,
              borderWidth: thickness,
              borderColor: c,
            }}
          />
        </>
      );
    }}
  </GlyphWrap>
);

// ── Chevron Down (Model picker trigger) ──────────────────────────
export const ChevronDownGlyph = ({ size = 16, color = '#9E9EA7', style }: GlyphProps) => (
  <GlyphWrap size={size} color={color} style={style}>
    {({ color: c, stroke }) => {
      const thickness = Math.max(1.7, stroke);
      return (
        <>
          <View
            style={{
              position: 'absolute',
              top: '42%',
              left: '20%',
              width: '38%',
              height: thickness,
              backgroundColor: c,
              borderRadius: 1,
              transform: [{ rotate: '45deg' }],
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: '42%',
              right: '20%',
              width: '38%',
              height: thickness,
              backgroundColor: c,
              borderRadius: 1,
              transform: [{ rotate: '-45deg' }],
            }}
          />
        </>
      );
    }}
  </GlyphWrap>
);

// ── More / horizontal ellipsis (Project row actions) ─────────────
export const MoreGlyph = ({ size = 18, color = '#9E9EA7', style }: GlyphProps) => (
  <GlyphWrap size={size} color={color} style={style}>
    {({ color: c, stroke }) => {
      const dot = Math.max(2.4, stroke * 1.4);
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: dot * 1.2 }}>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={{ width: dot, height: dot, borderRadius: 999, backgroundColor: c }}
            />
          ))}
        </View>
      );
    }}
  </GlyphWrap>
);

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
});