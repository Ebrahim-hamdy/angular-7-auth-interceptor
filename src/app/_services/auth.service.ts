import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, of } from "rxjs";
import { catchError, mapTo, tap, share, map } from "rxjs/operators";

import { Token } from "../_models";
import { User } from "../_models";

@Injectable({
  providedIn: "root"
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User>;
  public currentUser: Observable<User>;
  private loggedUser: string;
  public user;

  private readonly JWT_TOKEN = "authToken";
  private readonly REFRESH_TOKEN = "REFRESH_TOKEN";
  private readonly CURRENT_USER = "CURRENT_USER";
  private baseUrl: string = "http://localhost:3600/api/auth";

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User>(
      JSON.parse(localStorage.getItem(this.CURRENT_USER))
    );
    this.currentUser = this.currentUserSubject.asObservable();
    this.user = JSON.parse(localStorage.getItem(this.CURRENT_USER));
  }

  public get currentUserValue(): User {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string) {
    return this.http
      .post<any>(`${this.baseUrl}/login`, { email, password })
      .pipe(
        share(),
        map(user => {
          this.doLoginUser(email, user);
          this.currentUserSubject.next(user);
          localStorage.setItem(this.CURRENT_USER, JSON.stringify(user));
        })
      );
  }

  signup(user: any) {
    console.log(user);
    return this.http.post<any>(`${this.baseUrl}/signup`, user).pipe(
      map(status => {
        if (status) {
          return status;
        }
      })
    );
  }

  logout() {
    this.doLogoutUser();
    this.currentUserSubject.next(null);
  }

  isLoggedIn() {
    return !!this.getJwtToken();
  }

  refreshToken() {
    return this.http
      .post<any>(`${this.baseUrl}/refreshToken`, {
        refreshToken: this.getRefreshToken()
      })
      .pipe(
        share(),
        map(data => {
          if (data.authToken) {
            this.storeJwtToken(data.authToken);
            this.currentUserSubject.next(data);
          }

          return data.authToken;
        })
      );
  }

  getJwtToken() {
    return localStorage.getItem(this.JWT_TOKEN);
  }

  private doLoginUser(username: string, tokens: Token) {
    this.loggedUser = username;
    console.log(this.loggedUser);

    this.storeTokens(tokens);
  }

  private doLogoutUser() {
    this.loggedUser = null;
    this.removeTokens();
  }

  private getRefreshToken() {
    return localStorage.getItem(this.REFRESH_TOKEN);
  }

  private storeJwtToken(jwt: string) {
    localStorage.setItem(this.JWT_TOKEN, jwt);
  }

  private storeTokens(tokens: Token) {
    localStorage.setItem(this.JWT_TOKEN, tokens.authToken);
    localStorage.setItem(this.REFRESH_TOKEN, tokens.refreshToken);
  }

  private removeTokens() {
    localStorage.removeItem(this.JWT_TOKEN);
    localStorage.removeItem(this.REFRESH_TOKEN);
    localStorage.removeItem(this.CURRENT_USER);
  }
}
