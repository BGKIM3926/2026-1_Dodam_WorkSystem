import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function UsersActions({ onAdd }) {
    return (
        <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAdd}
        >
            사용자 추가
        </Button>
    );
}