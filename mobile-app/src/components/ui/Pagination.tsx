import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { theme } from '../../lib/theme';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
  style?: ViewStyle;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = 5,
  style,
}) => {
  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate start and end pages
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, currentPage + halfVisible);

      // Adjust if we're near the beginning or end
      if (currentPage <= halfVisible) {
        endPage = Math.min(totalPages, maxVisiblePages);
      } else if (currentPage >= totalPages - halfVisible) {
        startPage = Math.max(1, totalPages - maxVisiblePages + 1);
      }

      // Add first page and ellipsis if needed
      if (startPage > 1) {
        pages.push(1);
        if (startPage > 2) {
          pages.push('...');
        }
      }

      // Add visible pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis and last page if needed
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const handlePagePress = (page: number | string) => {
    if (typeof page === 'number' && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleFirst = () => {
    if (currentPage !== 1) {
      onPageChange(1);
    }
  };

  const handleLast = () => {
    if (currentPage !== totalPages) {
      onPageChange(totalPages);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  const visiblePages = getVisiblePages();

  return (
    <View style={[styles.container, style]}>
      {/* First page button */}
      {showFirstLast && (
        <TouchableOpacity
          style={[
            styles.pageButton,
            currentPage === 1 && styles.pageButtonDisabled,
          ]}
          onPress={handleFirst}
          disabled={currentPage === 1}
        >
          <Ionicons
            name="chevron-back-outline"
            size={16}
            color={currentPage === 1 ? theme.colors.mutedForeground : theme.colors.foreground}
          />
          <Ionicons
            name="chevron-back-outline"
            size={16}
            color={currentPage === 1 ? theme.colors.mutedForeground : theme.colors.foreground}
            style={{ marginLeft: -8 }}
          />
        </TouchableOpacity>
      )}

      {/* Previous page button */}
      {showPrevNext && (
        <TouchableOpacity
          style={[
            styles.pageButton,
            currentPage === 1 && styles.pageButtonDisabled,
          ]}
          onPress={handlePrevious}
          disabled={currentPage === 1}
        >
          <Ionicons
            name="chevron-back-outline"
            size={16}
            color={currentPage === 1 ? theme.colors.mutedForeground : theme.colors.foreground}
          />
        </TouchableOpacity>
      )}

      {/* Page numbers */}
      <View style={styles.pagesContainer}>
        {visiblePages.map((page, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.pageButton,
              typeof page === 'number' && page === currentPage && styles.pageButtonActive,
              typeof page === 'string' && styles.pageButtonDisabled,
            ]}
            onPress={() => handlePagePress(page)}
            disabled={typeof page === 'string'}
          >
            <Text
              style={[
                styles.pageText,
                typeof page === 'number' && page === currentPage && styles.pageTextActive,
                typeof page === 'string' && styles.pageTextDisabled,
              ]}
            >
              {page}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Next page button */}
      {showPrevNext && (
        <TouchableOpacity
          style={[
            styles.pageButton,
            currentPage === totalPages && styles.pageButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={currentPage === totalPages}
        >
          <Ionicons
            name="chevron-forward-outline"
            size={16}
            color={currentPage === totalPages ? theme.colors.mutedForeground : theme.colors.foreground}
          />
        </TouchableOpacity>
      )}

      {/* Last page button */}
      {showFirstLast && (
        <TouchableOpacity
          style={[
            styles.pageButton,
            currentPage === totalPages && styles.pageButtonDisabled,
          ]}
          onPress={handleLast}
          disabled={currentPage === totalPages}
        >
          <Ionicons
            name="chevron-forward-outline"
            size={16}
            color={currentPage === totalPages ? theme.colors.mutedForeground : theme.colors.foreground}
          />
          <Ionicons
            name="chevron-forward-outline"
            size={16}
            color={currentPage === totalPages ? theme.colors.mutedForeground : theme.colors.foreground}
            style={{ marginLeft: -8 }}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Simple pagination info component
export interface PaginationInfoProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  style?: ViewStyle;
}

export const PaginationInfo: React.FC<PaginationInfoProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  style,
}) => {
  const getInfoText = () => {
    if (totalItems && itemsPerPage) {
      const startItem = (currentPage - 1) * itemsPerPage + 1;
      const endItem = Math.min(currentPage * itemsPerPage, totalItems);
      return `Showing ${startItem}-${endItem} of ${totalItems} items`;
    }
    return `Page ${currentPage} of ${totalPages}`;
  };

  return (
    <View style={[styles.infoContainer, style]}>
      <Text style={styles.infoText}>{getInfoText()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  pagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  pageButton: {
    minWidth: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  pageButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pageButtonDisabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.muted,
  },
  pageText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    fontWeight: '500' as any,
  },
  pageTextActive: {
    color: theme.colors.primaryForeground,
  },
  pageTextDisabled: {
    color: theme.colors.mutedForeground,
  },
  infoContainer: {
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
});