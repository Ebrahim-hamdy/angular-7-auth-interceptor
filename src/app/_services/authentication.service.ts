import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { BehaviorSubject, Observable, of } from "rxjs";
import { share, map } from "rxjs/operators";
import { JwtHelperService } from "@auth0/angular-jwt";

import { User } from "../_models";

@Injectable({ providedIn: "root" })
export class AuthenticationService {
  private currentUserSubject: BehaviorSubject<User>;
  public currentUser: Observable<User>;

  constructor(private http: HttpClient, private decoder: JwtHelperService) {
    this.currentUserSubject = new BehaviorSubject<User>(
      JSON.parse(localStorage.getItem("currentUser"))
    );
    this.currentUser = this.currentUserSubject.asObservable();
    console.log(`current user`);
    console.log(this.currentUserSubject.value);
  }

  public get currentUserValue(): User {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string) {
    return this.http
      .post<any>(`http://localhost:3600/api/auth/login`, { email, password })
      .pipe(
        map(user => {
          // login successful if there's a jwt token in the response
          if (user && user.authToken) {
            // store user details and jwt token in local storage to keep user logged in between page refreshes
            localStorage.setItem("currentUser", JSON.stringify(user));
            localStorage.setItem("authToken", user.authToken);
            this.currentUserSubject.next(user);
          }

          return user;
        })
      );
  }

  signup(user: any) {
    console.log(user);
    return this.http
      .post<any>(`http://localhost:3600/api/auth/signup`, user)
      .pipe(
        map(status => {
          // login successful if there's a jwt token in the response
          if (status) {
            // store user details and jwt token in local storage to keep user logged in between page refreshes
            console.log(`signup status ${JSON.stringify(status)}`);
          }

          return status;
        })
      );
  }

  refreshToken(token: string) {
    const refreshToken = localStorage.getItem("refreshToken");
    const expiredToken = localStorage.getItem("token");

    return this.http
      .post<any>(`http://localhost:3600/api/auth/refreshToken`, { token })
      .pipe(
        share(),
        map(data => {
          // login successful if there's a jwt token in the response
          if (data.authToken) {
            // store user details and jwt token in local storage to keep user logged in between page refreshes
            console.log(`refresh Token ${JSON.stringify(data, null, 4)}`);
            localStorage.setItem("authToken", data.authToken);
            this.currentUserSubject.next(data);
          }

          return data.authToken;
        })
      );
  }

  getToken(): Observable<string> {
    const token = localStorage.getItem("authToken");
    const isTokenExpired = this.decoder.isTokenExpired(token);

    if (!isTokenExpired) {
      return of(token);
    }

    return this.refreshToken(token);
  }

  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem("currentUser");
    this.currentUserSubject.next(null);
  }
}
