import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Search, Users, Crown, Calendar } from 'lucide-react';

interface GroupInfo {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  publicEntryAllowed: boolean;
  created: string;
  updated: string;
}

interface GroupMember {
  user: {
    userId: number;
    username: string;
    displayName: string;
  };
  role: {
    id: number;
    name: string;
    rank: number;
  };
}

const Index = () => {
  const [groupId, setGroupId] = useState('');
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const { toast } = useToast();

  const fetchGroupInfo = async (id: string) => {
    try {
      const proxyUrl = 'https://api.allorigins.win/get?url=';
      const targetUrl = encodeURIComponent(`https://groups.roblox.com/v1/groups/${id}`);
      const response = await fetch(`${proxyUrl}${targetUrl}`);
      
      if (!response.ok) throw new Error('Group not found');
      
      const data = await response.json();
      return JSON.parse(data.contents);
    } catch (error) {
      throw new Error('Failed to fetch group information');
    }
  };

  const fetchGroupMembers = async (id: string, cursor: string = '') => {
    try {
      const proxyUrl = 'https://api.allorigins.win/get?url=';
      const targetUrl = encodeURIComponent(
        `https://groups.roblox.com/v1/groups/${id}/users?sortOrder=Asc&limit=100${cursor ? `&cursor=${cursor}` : ''}`
      );
      const response = await fetch(`${proxyUrl}${targetUrl}`);
      
      if (!response.ok) throw new Error('Failed to fetch members');
      
      const data = await response.json();
      return JSON.parse(data.contents);
    } catch (error) {
      throw new Error('Failed to fetch group members');
    }
  };

  const handleSearch = async () => {
    if (!groupId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid group ID",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setMembers([]);
    setCurrentPage(1);

    try {
      // Fetch group info
      const groupData = await fetchGroupInfo(groupId);
      setGroupInfo(groupData);

      // Fetch initial members
      const membersData = await fetchGroupMembers(groupId);
      setMembers(membersData.data || []);
      setHasNextPage(!!membersData.nextPageCursor);

      toast({
        title: "Success",
        description: `Loaded ${groupData.name} with ${membersData.data?.length || 0} members`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
      setGroupInfo(null);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMembers = async () => {
    if (!groupId || !hasNextPage) return;

    try {
      const membersData = await fetchGroupMembers(groupId, `page_${currentPage + 1}`);
      setMembers(prev => [...prev, ...(membersData.data || [])]);
      setHasNextPage(!!membersData.nextPageCursor);
      setCurrentPage(prev => prev + 1);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load more members",
        variant: "destructive",
      });
    }
  };

  const getRankColor = (rank: number) => {
    if (rank >= 200) return 'bg-yellow-500';
    if (rank >= 100) return 'bg-purple-500';
    if (rank >= 50) return 'bg-blue-500';
    if (rank >= 10) return 'bg-green-500';
    return 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Roblox Group Explorer
          </h1>
          <p className="text-xl text-gray-300">
            Discover group members and their ranks instantly
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8 bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search Group
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter Roblox Group ID"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                onClick={handleSearch} 
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Group Info */}
        {groupInfo && (
          <Card className="mb-8 bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                Group Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{groupInfo.name}</h2>
                <p className="text-gray-300">{groupInfo.description || 'No description available'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-white">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>{groupInfo.memberCount.toLocaleString()} members</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Calendar className="w-4 h-4 text-green-400" />
                  <span>Created {new Date(groupInfo.created).toLocaleDateString()}</span>
                </div>
                <Badge 
                  variant={groupInfo.publicEntryAllowed ? "default" : "secondary"}
                  className="w-fit"
                >
                  {groupInfo.publicEntryAllowed ? 'Public' : 'Private'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full bg-white/20" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24 bg-white/20" />
                      <Skeleton className="h-3 w-16 bg-white/20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Members Grid */}
        {members.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white">Group Members ({members.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <Card 
                  key={`${member.user.userId}`}
                  className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 transition-all duration-200 hover:transform hover:scale-105"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold"
                      >
                        {member.user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white truncate">
                          {member.user.displayName}
                        </h4>
                        <p className="text-sm text-gray-400 truncate">
                          @{member.user.username}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            className={`text-xs ${getRankColor(member.role.rank)} text-white`}
                          >
                            Rank {member.role.rank}
                          </Badge>
                          <span className="text-xs text-gray-300 truncate">
                            {member.role.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {hasNextPage && (
              <div className="text-center">
                <Button 
                  onClick={loadMoreMembers}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  Load More Members
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !groupInfo && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Group Selected</h3>
            <p className="text-gray-400">Enter a Roblox Group ID above to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
