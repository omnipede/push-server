import {atom} from "recoil";

/**
 * 로그인 되어 있는지 나타내는 상태
 */
export const adminLoginState = atom({
    key: 'adminLoginState',
    default: {
        loggedIn: false,
        username: '',
        accessToken: '',
        exp: 0,
    }
});
