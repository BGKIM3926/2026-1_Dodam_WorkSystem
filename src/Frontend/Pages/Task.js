import MainGrid from './components/MainGrid';

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Task() {

    const navigate = useNavigate();
    
    useEffect(() => {
            const user = localStorage.getItem('loginUser');
    
            if (!user) {
                navigate('/');
            }
        }, []);
    return <MainGrid />;
}