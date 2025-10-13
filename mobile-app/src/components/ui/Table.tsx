import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

import { theme } from '../../lib/theme';

interface TableProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface TableHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface TableBodyProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface TableFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface TableRowProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface TableHeadProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface TableCellProps {
  children: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  numeric?: boolean;
}

interface TableCaptionProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

// Main Table component with horizontal scroll
export function Table({ children, style }: TableProps) {
  return (
    <View style={[styles.tableContainer, style]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.table}>
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

// Table Header
export function TableHeader({ children, style }: TableHeaderProps) {
  return (
    <View style={[styles.tableHeader, style]}>
      {children}
    </View>
  );
}

// Table Body
export function TableBody({ children, style }: TableBodyProps) {
  return (
    <View style={[styles.tableBody, style]}>
      {children}
    </View>
  );
}

// Table Footer
export function TableFooter({ children, style }: TableFooterProps) {
  return (
    <View style={[styles.tableFooter, style]}>
      {children}
    </View>
  );
}

// Table Row
export function TableRow({ children, style }: TableRowProps) {
  return (
    <View style={[styles.tableRow, style]}>
      {children}
    </View>
  );
}

// Table Head (header cell)
export function TableHead({ children, style }: TableHeadProps) {
  return (
    <View style={[styles.tableHead, style]}>
      <Text style={styles.tableHeadText}>
        {children}
      </Text>
    </View>
  );
}

// Table Cell
export function TableCell({ 
  children, 
  style, 
  textStyle, 
  numeric = false 
}: TableCellProps) {
  return (
    <View style={[styles.tableCell, numeric && styles.tableCellNumeric, style]}>
      <Text style={[styles.tableCellText, numeric && styles.tableCellTextNumeric, textStyle]}>
        {children}
      </Text>
    </View>
  );
}

// Table Caption
export function TableCaption({ children, style }: TableCaptionProps) {
  return (
    <View style={[styles.tableCaption, style]}>
      <Text style={styles.tableCaptionText}>
        {children}
      </Text>
    </View>
  );
}

// Utility component for responsive tables
interface ResponsiveTableProps {
  data: Array<Record<string, any>>;
  columns: Array<{
    key: string;
    title: string;
    numeric?: boolean;
    render?: (value: any, item: Record<string, any>) => React.ReactNode;
  }>;
  caption?: string;
}

export function ResponsiveTable({ data, columns, caption }: ResponsiveTableProps) {
  return (
    <Table>
      {caption && <TableCaption>{caption}</TableCaption>}
      
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.key} style={{ minWidth: 100 }}>
              {column.title}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>

      <TableBody>
        {data.map((item, index) => (
          <TableRow key={index}>
            {columns.map((column) => (
              <TableCell 
                key={column.key} 
                numeric={column.numeric}
                style={{ minWidth: 100 }}
              >
                {column.render 
                  ? column.render(item[column.key], item)
                  : item[column.key]
                }
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

const styles = StyleSheet.create({
  tableContainer: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.card,
  },
  scrollView: {
    flex: 1,
  },
  table: {
    minWidth: '100%',
  },

  // Header
  tableHeader: {
    backgroundColor: theme.colors.muted,
  },

  // Body
  tableBody: {
    backgroundColor: theme.colors.card,
  },

  // Footer
  tableFooter: {
    backgroundColor: theme.colors.muted,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },

  // Row
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 44,
  },

  // Head (header cell)
  tableHead: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    justifyContent: 'center',
  },
  tableHeadText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600' as any,
    color: theme.colors.foreground,
  },

  // Cell
  tableCell: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    justifyContent: 'center',
  },
  tableCellNumeric: {
    alignItems: 'flex-end',
  },
  tableCellText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  tableCellTextNumeric: {
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },

  // Caption
  tableCaption: {
    padding: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.muted,
  },
  tableCaptionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
});