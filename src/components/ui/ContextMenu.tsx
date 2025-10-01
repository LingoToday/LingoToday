import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { theme } from '../../lib/theme';

export interface ContextMenuProps {
  children: React.ReactNode;
  items: Array<{
    label: string;
    onPress: () => void;
    icon?: string;
    destructive?: boolean;
    disabled?: boolean;
  }>;
  style?: any;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  children,
  items,
  style,
}) => {
  const [visible, setVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleLongPress = (event: any) => {
    const { pageX, pageY } = event.nativeEvent;
    setMenuPosition({ x: pageX, y: pageY });
    setVisible(true);
  };

  const handleItemPress = (onPress: () => void) => {
    setVisible(false);
    onPress();
  };

  const closeMenu = () => {
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        onLongPress={handleLongPress}
        delayLongPress={500}
        style={style}
      >
        {children}
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableWithoutFeedback onPress={closeMenu}>
          <View style={styles.overlay}>
            <View
              style={[
                styles.menu,
                {
                  left: Math.min(menuPosition.x, 300),
                  top: Math.min(menuPosition.y, 500),
                },
              ]}
            >
              {items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.menuItem,
                    item.disabled && styles.menuItemDisabled,
                    index === items.length - 1 && styles.lastMenuItem,
                  ]}
                  onPress={() => handleItemPress(item.onPress)}
                  disabled={item.disabled}
                >
                  <View style={styles.menuItemContent}>
                    {item.icon && (
                      <Ionicons
                        name={item.icon as any}
                        size={16}
                        color={
                          item.destructive
                            ? theme.colors.destructive
                            : item.disabled
                            ? theme.colors.mutedForeground
                            : theme.colors.foreground
                        }
                        style={styles.menuItemIcon}
                      />
                    )}
                    <Text
                      style={[
                        styles.menuItemText,
                        item.destructive && styles.destructiveText,
                        item.disabled && styles.disabledText,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menu: {
    position: 'absolute',
    backgroundColor: theme.colors.popover,
    borderRadius: theme.borderRadius.md,
    minWidth: 150,
    maxWidth: 250,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.lg,
  },
  menuItem: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  menuItemIcon: {
    marginRight: theme.spacing.sm,
  },
  menuItemText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    flex: 1,
  },
  destructiveText: {
    color: theme.colors.destructive,
  },
  disabledText: {
    color: theme.colors.mutedForeground,
  },
});