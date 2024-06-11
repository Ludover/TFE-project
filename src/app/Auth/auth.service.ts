import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { AuthData } from "./auth-data.model";
import { response } from "express";

@Injectable({ providedIn: "root" })
export class AuthService {

    constructor(private http: HttpClient) {}

    createUser(email: string, password: string) {
        const AuthData: AuthData = {email: email, password: password}
        this.http.post("http://localhost:3000/api/user/signup", AuthData)
            .subscribe(response => {
                console.log(response);
            })
    }

    login(email: string, password: string) {
        const AuthData: AuthData = {email: email, password: password}
        this.http.post("http://localhost:3000/api/user/login", AuthData)
        .subscribe(response => {
            console.log(response);
        })
    }
}