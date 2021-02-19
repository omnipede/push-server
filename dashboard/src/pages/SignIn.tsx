import React, {useState} from "react";
import {
    Avatar,
    Button,
    Container,
    CssBaseline,
    makeStyles,
    TextField,
    Typography
} from "@material-ui/core";
import { LockOutlined } from "@material-ui/icons";
import {login} from "../application/login";

// Page style
const useStyles = makeStyles((theme) => ({
    paper: {
        marginTop: theme.spacing(8),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    avatar: {
        margin: theme.spacing(1),
        backgroundColor: theme.palette.secondary.main,
    },
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(1),
    },
    submit: {
        margin: theme.spacing(3, 0, 2),
    },
}));

/**
 * Login page
 * @constructor
 */
function SignIn() {
    const classes = useStyles();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // 입력 받은 user name 이 valid 한지 확인하는 state
    const [usernameValidation, setUsernameValidation] = useState({
        isError: false,
        errorMessage: '',
    });

    // 입력 받은 password 가 valid 한지 확인하는 state
    const [passwordValidation, setPasswordValidation] = useState({
        isError: false,
        errorMessage: '',
    });

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline />
            <div className={classes.paper}>
                <Avatar className={classes.avatar}>
                    <LockOutlined />
                </Avatar>
                <Typography component="h1" variant="h5">
                    Sign in
                </Typography>
                <form className={classes.form} noValidate>
                    {/* Username input */}
                    <TextField
                        error={usernameValidation.isError}
                        helperText={usernameValidation.errorMessage}
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="User name"
                        name="username"
                        autoComplete="username"
                        autoFocus
                        value={username}
                        onChange={(e) => {
                            setUsernameValidation({
                                isError: false,
                                errorMessage: '',
                            })
                            setUsername(e.target.value)
                        }}
                    />
                    {/* Password input */}
                    <TextField
                        error={passwordValidation.isError}
                        helperText={passwordValidation.errorMessage}
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => {
                            setPasswordValidation({
                                isError: false,
                                errorMessage: '',
                            })
                            setPassword(e.target.value)
                        }}
                    />
                    {/* Submit button */}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        className={classes.submit}
                        onClick={(e) => {
                            e.preventDefault();
                            // Username 의 길이가 0 이면 에러
                            if (username.length === 0)
                                setUsernameValidation({
                                    isError: true,
                                    errorMessage: 'User name is required',
                                });
                            // Password 의 길이가 0 이면 에러
                            if (password.length === 0)
                                setPasswordValidation({
                                    isError: true,
                                    errorMessage: 'Password is required'
                                });
                            // Console log
                            console.log({
                                username, password
                            });
                            // Do login logic
                            login(username, password);
                        }}
                    >
                        Sign In
                    </Button>
                </form>
            </div>
        </Container>
    );
}

export default SignIn;
