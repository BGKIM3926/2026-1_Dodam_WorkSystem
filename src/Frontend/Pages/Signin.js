import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MuiCard from '@mui/material/Card';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import ForgotPassword from './components/ForgotPassword';
import dodamIcon from './internals/components/dodam_icon.png';
import AppTheme from './shared-theme/AppTheme';
import ColorModeSelect from './shared-theme/ColorModeSelect';

const Card = styled(MuiCard)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignSelf: 'center',
    width: '100%',
    padding: theme.spacing(4),
    gap: theme.spacing(2),
    margin: 'auto',
    [theme.breakpoints.up('sm')]: {
        maxWidth: '450px',
    },
    boxShadow:
        'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
    ...theme.applyStyles('dark', {
        boxShadow:
            'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
    }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
    height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
    minHeight: '100%',
    padding: theme.spacing(2),
    [theme.breakpoints.up('sm')]: {
        padding: theme.spacing(4),
    },
    '&::before': {
        content: '""',
        display: 'block',
        position: 'absolute',
        zIndex: -1,
        inset: 0,
        backgroundImage:
            'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
        backgroundRepeat: 'no-repeat',
        ...theme.applyStyles('dark', {
            backgroundImage:
                'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
        }),
    },
}));

function Signin(props) {
    const [idError, setIdError] = React.useState(false);
    const [idErrorMessage, setIdErrorMessage] = React.useState('');
    const [passwordError, setPasswordError] = React.useState(false);
    const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
    const [open, setOpen] = React.useState(false);
    const [savedId, setSavedId] = React.useState('');
    const [rememberId, setRememberId] = React.useState(false);
    const navigate = useNavigate();

    React.useEffect(() => {
        const stored = localStorage.getItem('savedLoginId');
        if (stored) {
            setSavedId(stored);
            setRememberId(true);
        }
    }, []);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const data = new FormData(event.currentTarget);

        const id = String(data.get('id'));
        const password = String(data.get('password'));
        const role = String(data.get('role'));
        


        if (!validateInputs(id, password)) return;

        try {
            const response = await fetch('http://localhost:8080/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, password, role }),
            });

            if (response.ok) {
                const result = await response.json();
                // alert('로그인 성공');
                if (rememberId) {
                    localStorage.setItem('savedLoginId', id);
                } else {
                    localStorage.removeItem('savedLoginId');
                }
                localStorage.setItem('loginUser', JSON.stringify(result));
                navigate('/dashboard/home');
            } else {
                alert('아이디 또는 비밀번호가 틀렸습니다.');
            }

        } catch (error) {
            console.error(error);
            alert('서버 오류 발생');
        }
    };

    const validateInputs = (id, password) => {
        let isValid = true;

        const idValue = String(id).trim();
        const pwValue = String(password).trim();

        if (!idValue || idValue.length < 4) {
            setIdError(true);
            setIdErrorMessage('ID는 4자 이상 입력하세요.');
            isValid = false;
        } else {
            setIdError(false);
            setIdErrorMessage('');
        }

        if (!pwValue || pwValue.length < 4) {
            setPasswordError(true);
            setPasswordErrorMessage('비밀번호는 4자 이상 입력하세요.');
            isValid = false;
        } else {
            setPasswordError(false);
            setPasswordErrorMessage('');
        }

        return isValid;
    };

    return (
        <AppTheme {...props}>
            <CssBaseline enableColorScheme />
            <SignInContainer direction="column" justifyContent="space-between">
                <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
                <Card variant="outlined">
                    <Box
                        component="img"
                        src={dodamIcon}
                        alt="Dodam logo"
                        sx={{
                            width: 100,
                            height: 50,
                            objectFit: 'contain',
                            alignSelf: 'flex-start',
                            ml: -4,
                        }}
                    />
                    <Typography
                        component="h1"
                        variant="h4"
                        sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
                    >
                        로그인
                    </Typography>
                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        noValidate
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                            gap: 2,
                        }}
                    >
                        <FormControl>
                            <FormLabel htmlFor="id">ID</FormLabel>
                            <TextField
                                error={idError}
                                helperText={idErrorMessage}
                                id="id"
                                type="text"
                                name="id"
                                placeholder="ID를 입력하세요."
                                autoComplete="username"
                                autoFocus
                                required
                                fullWidth
                                variant="outlined"
                                color={idError ? 'error' : 'primary'}
                                value={savedId}
                                onChange={(e) => setSavedId(e.target.value)}
                            />
                        </FormControl>
                        <FormControl>
                            <FormLabel htmlFor="password">비밀번호</FormLabel>
                            <TextField
                                error={passwordError}
                                helperText={passwordErrorMessage}
                                name="password"
                                placeholder="비밀번호를 입력하세요."
                                type="password"
                                id="password"
                                autoComplete="current-password"
                                required
                                fullWidth
                                variant="outlined"
                                color={passwordError ? 'error' : 'primary'}
                            />
                        </FormControl>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={rememberId}
                                    onChange={(e) => setRememberId(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label="ID 저장"
                        />
                        <ForgotPassword open={open} handleClose={handleClose} />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                        >
                            로그인
                        </Button>
                        <Link
                            component="button"
                            type="button"
                            onClick={handleClickOpen}
                            variant="body2"
                            sx={{ alignSelf: 'center' }}
                        >
                            비밀번호 찾기
                        </Link>
                    </Box> 
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    </Box>
                </Card>
            </SignInContainer>
        </AppTheme>
    );
}

export default Signin;