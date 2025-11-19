
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface CustomWebViewProps {
  uri: string;
  style?: any;
  startInLoadingState?: boolean;
  renderLoading?: () => React.ReactElement;
  onError?: (syntheticEvent: any) => void;
}

export const CustomWebView: React.FC<CustomWebViewProps> = ({
  uri,
  style,
  startInLoadingState,
  renderLoading,
  onError,
}) => {
  if (Platform.OS === 'web') {
    // Render an iframe for web platforms
    return (
      <View style={[styles.container, style]}>
        <iframe
          src={uri}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
          title="PDF Viewer"
          onError={(e) => {
            console.error('iframe error:', e);
            if (onError) {
              onError({ nativeEvent: e });
            }
          }}
        />
      </View>
    );
  } else {
    // Render WebView for native platforms (iOS/Android)
    return (
      <WebView
        source={{ uri }}
        style={style}
        startInLoadingState={startInLoadingState}
        renderLoading={renderLoading}
        onError={onError}
      />
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
