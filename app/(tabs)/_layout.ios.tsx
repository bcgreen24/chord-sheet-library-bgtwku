
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger key="library" name="(home)">
        <Icon sf="music.note.list" />
        <Label>Library</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="setlists" name="setlists">
        <Icon sf="list.bullet.rectangle" />
        <Label>Setlists</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
