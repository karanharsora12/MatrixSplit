import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Sparkles, ArrowLeft } from 'lucide-react-native';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Input,
  Text,
  Separator,
  Progress,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/components/ui';
import { useWatermelonTheme } from '@/theme';

export default function UIShowcaseScreen() {
  const router = useRouter();
  const { theme } = useWatermelonTheme();

  const [activeTab, setActiveTab] = useState('overview');
  const [inputText, setInputText] = useState('');
  const [progressVal, setProgressVal] = useState(65);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.headerTitleBox}>
          <Text className="text-lg font-bold text-foreground">React Native Reusables</Text>
          <Text className="text-xs text-muted-foreground">User-friendly shadcn/ui components</Text>
        </View>
        <Badge variant="outline">
          <Text className="text-xs font-semibold text-primary">v1.0</Text>
        </Badge>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Info Alert */}
        <Alert icon={Sparkles} className="mb-4 border-primary/20 bg-primary/5">
          <AlertTitle className="text-primary font-semibold">User-Friendly Design System</AlertTitle>
          <AlertDescription className="text-muted-foreground text-xs">
            Powered by React Native Reusables and NativeWind with accessible primitives and responsive tokens.
          </AlertDescription>
        </Alert>

        {/* Tabs Component */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="overview">
              <Text>Overview</Text>
            </TabsTrigger>
            <TabsTrigger value="buttons">
              <Text>Buttons</Text>
            </TabsTrigger>
            <TabsTrigger value="cards">
              <Text>Cards</Text>
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Overview */}
          <TabsContent value="overview" className="mt-4 gap-4">
            {/* Progress Section */}
            <Card>
              <CardHeader>
                <CardTitle>Spending Goal Progress</CardTitle>
                <CardDescription>Track monthly group budget consumption</CardDescription>
              </CardHeader>
              <CardContent className="gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-foreground">Trip to Goa</Text>
                  <Text className="text-sm font-bold text-primary">{progressVal}%</Text>
                </View>
                <Progress value={progressVal} className="h-2.5" />
                <View className="flex-row gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => setProgressVal((p) => Math.max(0, p - 10))}
                  >
                    <Text>-10%</Text>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => setProgressVal((p) => Math.min(100, p + 10))}
                  >
                    <Text>+10%</Text>
                  </Button>
                </View>
              </CardContent>
            </Card>

            {/* Avatars & Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Avatars & Badges</CardTitle>
                <CardDescription>Clean profile fallbacks and status tags</CardDescription>
              </CardHeader>
              <CardContent className="gap-4">
                <View className="flex-row items-center gap-3">
                  <Avatar alt="Karan Sharma" className="h-12 w-12 border border-border">
                    <AvatarImage source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' }} />
                    <AvatarFallback>
                      <Text className="text-xs font-bold text-primary">KS</Text>
                    </AvatarFallback>
                  </Avatar>
                  <Avatar alt="Alex Doe" className="h-10 w-10 border border-border">
                    <AvatarFallback>
                      <Text className="text-xs font-semibold text-muted-foreground">AD</Text>
                    </AvatarFallback>
                  </Avatar>
                  <Avatar alt="Sarah" className="h-8 w-8 border border-border">
                    <AvatarFallback>
                      <Text className="text-xs font-medium text-primary">S</Text>
                    </AvatarFallback>
                  </Avatar>
                </View>

                <Separator />

                <View className="flex-row flex-wrap gap-2">
                  <Badge variant="default">
                    <Text>Settled</Text>
                  </Badge>
                  <Badge variant="secondary">
                    <Text>Pending Approval</Text>
                  </Badge>
                  <Badge variant="destructive">
                    <Text>Overdue</Text>
                  </Badge>
                  <Badge variant="outline">
                    <Text>Split Equal</Text>
                  </Badge>
                </View>
              </CardContent>
            </Card>

            {/* Input & Form Controls */}
            <Card>
              <CardHeader>
                <CardTitle>User Input</CardTitle>
                <CardDescription>Accessible mobile inputs with focus rings</CardDescription>
              </CardHeader>
              <CardContent className="gap-3">
                <Input
                  placeholder="Enter expense note or title..."
                  value={inputText}
                  onChangeText={setInputText}
                />
                {inputText.length > 0 && (
                  <Text className="text-xs text-muted-foreground">
                    Preview: {inputText}
                  </Text>
                )}
              </CardContent>
            </Card>

            {/* Modal Dialog */}
            <Card>
              <CardHeader>
                <CardTitle>Dialog Component</CardTitle>
                <CardDescription>Portal-hosted accessible modal dialogs</CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" className="w-full">
                      <Text>Open Settlement Dialog</Text>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Confirm Settlement</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to record a payment of ₹1,250 to Alex? This action will update group balances.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                      <DialogClose asChild>
                        <Button variant="outline">
                          <Text>Cancel</Text>
                        </Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button variant="default">
                          <Text>Confirm Payment</Text>
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Buttons */}
          <TabsContent value="buttons" className="mt-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Button Variants</CardTitle>
                <CardDescription>All supported design token variants</CardDescription>
              </CardHeader>
              <CardContent className="gap-3">
                <Button variant="default">
                  <Text>Primary Action</Text>
                </Button>
                <Button variant="secondary">
                  <Text>Secondary Action</Text>
                </Button>
                <Button variant="outline">
                  <Text>Outline Button</Text>
                </Button>
                <Button variant="destructive">
                  <Text>Delete Expense</Text>
                </Button>
                <Button variant="ghost">
                  <Text>Ghost Button</Text>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Button Sizes</CardTitle>
                <CardDescription>From compact tags to hero buttons</CardDescription>
              </CardHeader>
              <CardContent className="gap-3">
                <Button size="sm">
                  <Text>Small Button</Text>
                </Button>
                <Button size="default">
                  <Text>Default Button</Text>
                </Button>
                <Button size="lg">
                  <Text>Large Hero Action</Text>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Cards */}
          <TabsContent value="cards" className="mt-4 gap-4">
            <Card className="border-primary/30">
              <CardHeader>
                <View className="flex-row items-center justify-between">
                  <CardTitle>Weekend Camping</CardTitle>
                  <Badge variant="outline">
                    <Text className="text-primary font-bold">Trip</Text>
                  </Badge>
                </View>
                <CardDescription>Created by Karan Sharma • 4 members</CardDescription>
              </CardHeader>
              <CardContent>
                <View className="flex-row items-baseline gap-1">
                  <Text className="text-2xl font-extrabold text-foreground">₹4,850</Text>
                  <Text className="text-xs text-muted-foreground">total spent</Text>
                </View>
                <Text className="text-xs text-primary font-semibold mt-1">You are owed ₹1,200</Text>
              </CardContent>
              <CardFooter className="justify-between border-t border-border pt-4">
                <Text className="text-xs text-muted-foreground">Updated 10m ago</Text>
                <Button size="sm" variant="secondary">
                  <Text>View Details</Text>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  headerTitleBox: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
});
