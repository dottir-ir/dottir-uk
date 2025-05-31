import React from 'react';
import { Link } from 'react-router-dom';
import { Case } from '../../types/case';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/Card';

interface CaseCardProps {
  case_: Case;
  authorName: string;
  authorAvatar?: string;
}

export const CaseCard: React.FC<CaseCardProps> = ({ case_, authorName, authorAvatar }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <Avatar src={authorAvatar} alt={authorName} />
          <div>
            <p className="text-sm font-medium">{authorName}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(case_.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Badge variant={case_.status === 'published' ? 'default' : 'secondary'}>
            {case_.status}
          </Badge>
          <Badge variant="outline">{case_.specialty}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Link to={`/cases/${case_.id}`} className="hover:underline">
          <h3 className="text-lg font-semibold mb-2">{case_.title}</h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {case_.description}
        </p>
        {case_.tags && case_.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {case_.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>{case_.view_count} views</span>
          {case_.is_educational && (
            <Badge variant="outline" className="text-xs">Educational</Badge>
          )}
        </div>
        <Link to={`/cases/${case_.id}`} className="text-primary hover:underline">
          Read more
        </Link>
      </CardFooter>
    </Card>
  );
}; 