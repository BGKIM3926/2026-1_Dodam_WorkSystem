import AddIcon from '@mui/icons-material/Add';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function UsersActions({ onAdd }) {
    const navigate = useNavigate();
    return (
        <Button
            variant="contained"
            startIcon={<AddIcon />}
             onClick={() => navigate(`/dashboard/users/create`)}
        >
            사용자 추가
        </Button>
    );
}