import axios from 'axios';
import {err, ok, Result} from "neverthrow";
import * as jwt from 'jsonwebtoken';
import {Optional} from "typescript-optional";

/**
 * Login method. 성공 시 username, access token 만료 시간을
 * @param username 사용자 아이디
 * @param password 사용자 패스워드
 * @returns Access token and jwt expiration time
 */
export async function login(username: string, password: string)
    : Promise<Result<{ accessToken: string, exp: number }, 'login-failed' | 'invalid-token'>> {
    // Call login api
    const result = await callLoginApi(username, password);

    // 로그인 실패
    if (result.isErr())
        return err('login-failed');

    // Get access token
    const accessToken: string = result.value;

    // Get decoded access token
    const decodedResult = decodedJwt(accessToken).orNull();
    if (!decodedResult)
        return err('invalid-token');

    // JWT 내부에서 username 및 만료시간 추출
    const { exp } = decodedResult;

    // Save username, exp to local storage
    localStorage.setItem("admin.username", username);
    localStorage.setItem("admin.exp", exp.toString());

    // 로그인 성공
    return ok({ accessToken, exp });
}

/**
 * Method that call login api of server
 * @param username Username to login
 * @param password Password of user
 * @returns access token
 */
async function callLoginApi(username: string, password: string)
    : Promise<Result<string, 'login-failed' | 'login-server-error' >> {
    return new Promise((resolve) => {
        // Call api via axios
        axios({
            url: '/api/v1/auth/login',
            method: 'post',
            headers: {
                'content-type': 'application/json'
            },
            data: {
                username, password
            },
        }).then((response) => {
            // If success, return access token
            const { access_token: accessToken } = response.data;
            return resolve(ok(accessToken));
        }).catch((error) => {
            // If failed,
            // Console log 에 에러가 남지 않도록 하기 위한 코드
            console.clear();

            // Check whether error is client error
            if (error.response) {
                const { status }: { status: number } = error.response;
                const loginFailedStatus = [401, 404];
                // status 가 401, 404 면 로그인 실패
                if (loginFailedStatus.indexOf(status) >= 0) {
                    return resolve(err('login-failed'));
                }
            }
            return resolve(err('login-server-error'));
        });
    });
}

/**
 * JWT 토큰을 decode 하여 토큰 내부의 만료 시간과 username 필드를 추출하는 메소드
 * @param token JWT string
 */
function decodedJwt(token: string): Optional<{ username: string, exp: number }> {
    try {
        const decoded = jwt.decode(token);
        // Decode 결과가 map 이 아닐 경우
        if (typeof decoded === 'string' || decoded === null)
            return Optional.empty();

        const { username, exp } = decoded;
        // 두 필드 중 하나라도 없으면 empty 반환
        if (!username || !exp)
            return Optional.empty();
        // Username, 만료시간 반환
        return Optional.of({ username, exp });
    } catch (e) {
        // Token decode 중 에러가 발생했을 경우
        return Optional.empty();
    }
}


