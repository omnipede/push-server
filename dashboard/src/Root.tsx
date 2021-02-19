import {BrowserRouter, Route} from "react-router-dom";
import SignIn from "./pages/SignIn";
import Temp from "./pages/Temp";

function Root() {
    return (
        <BrowserRouter>
            <Route exact path = "/login" component={ SignIn } />
            <Route exact path = "/temp" component={ Temp } />
        </BrowserRouter>
    );
}

export default Root;
