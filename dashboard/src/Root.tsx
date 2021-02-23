import {BrowserRouter, Route} from "react-router-dom";
import SignIn from "./pages/SignIn";
import Temp from "./pages/Temp";
import {useRecoilValue} from "recoil";
import {adminLoginState} from "./store/Admin";
import React from "react";

/**
 * Root component
 */
function Root() {

    // 로그인 여부를 저장하는 state 를 불러옴
    const adminLogin = useRecoilValue(adminLoginState);

    // If not logged in, render login page
    if (!adminLogin.loggedIn)
        return (
            <SignIn />
        );

    // Go to other pages
    return (
        <BrowserRouter>
            <Route exact path = "/temp" component={ Temp } />
        </BrowserRouter>
    );
}

export default Root;
