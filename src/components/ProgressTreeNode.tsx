import * as React from 'react';
import CircularProgress, {
  CircularProgressProps,
} from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { Collapse, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useState } from 'react';

interface CircularProgressWithLabelProps extends CircularProgressProps {
  value: number;
}

function CircularProgressWithLabel(props: CircularProgressWithLabelProps) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <CircularProgress variant="determinate" {...props} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography
          variant="caption"
          component="div"
          sx={{ color: 'text.secondary' }}
        >{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  );
}

interface ProgressTreeNodeProps {
  initialProgress?: number;
  label?: React.ReactNode;
  data?: React.ReactNode;
  children?: React.ReactNode;
  initialExpanded?: boolean;
  autoProgress?: boolean;
}

export default function ProgressTreeNode({
  initialProgress = 10,
  label,
  data,
  children,
  initialExpanded = false,
  autoProgress = false,
}: ProgressTreeNodeProps) {
  const [progress, setProgress] = useState(initialProgress);
  const [expanded, setExpanded] = useState(initialExpanded);
  const hasChildren = React.Children.count(children) > 0;

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 1,
          mb: 1
        }}
      >
        <CircularProgressWithLabel value={progress} />

        {label && (
          <Box sx={{ ml: 2, flexGrow: 1 }}>
            {label}
          </Box>
        )}

        {data && (
          <Box sx={{ mx: 2 }}>
            {data}
          </Box>
        )}

        {hasChildren && (
          <IconButton
            onClick={handleToggle}
            size="small"
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        )}
      </Box>

      {hasChildren && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ pl: 4 }}>
            {children}
          </Box>
        </Collapse>
      )}
    </Box>
  );
}
