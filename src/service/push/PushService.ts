import { Injectable } from '@nestjs/common';
import * as firebase from 'firebase-admin';
import { messaging } from 'firebase-admin/lib/messaging';
import { app } from 'firebase-admin/lib/firebase-namespace-api';
import { Client } from '../client/ClientService';
import MulticastMessage = messaging.MulticastMessage;
import App = app.App;
import Message = messaging.Message;

@Injectable()
export class PushService {

  // FCM sdk 캐시
  private mapOfApps: Map<string, App> = new Map<string, App>();

  /**
   * Multi cast message 를 전송하는 메소드
   * @param client 메시지를 수신할 클라이언트
   * @param message 전송할 메시지
   * @returns invalid token 반환
   */
  public async sendMulti(client: Client, message: MulticastMessage): Promise<string[]> {
    const app = await this.getCachedApp(client);
    // multi message 를 보내고 결과를 반환한다.
    // Dry-run: true 면 푸시가 안 간다
    const response = await app.messaging().sendMulticast(message, false);
    // 에러인 토큰만 찾아서 반환한다.
    return response.responses
      .map((res, idx) => res.error ? message.tokens[idx] : null)
      .filter((res) => res != null)
  }

  /**
   * 일반 메시지를 전송하는 메소드
   * @param client 메시지를 수신할 앱이 등록된 클라이언트
   * @param message 전송할 메시지
   * @returns 성공 여부
   */
  public async send(client: Client, message: Message): Promise<boolean> {
    const app = await this.getCachedApp(client);
    // 메시지를 보내고 결과를 반환한다.
    await app.messaging().send(message, false);
    return true;
  }

  /**
   * 메모리에 캐시된 FCM sdk 객체 (App) 을 삭제한다.
   * @param client
   * @private
   */
  private async getCachedApp(client: Client): Promise<App> {
    const { id, account } = client;

    // Retrieve cached app
    const cachedApp = this.mapOfApps.get(id);
    if (cachedApp)
      return cachedApp;

    // create new app
    const app = await firebase.initializeApp({
      credential: firebase.credential.cert(JSON.parse(account)),
    }, id);

    // 맵에 저장
    this.mapOfApps.set(id, app);
    return app;
  }

  // todo 캐시된 FCM sdk 객체를 삭제하는 메소드 추가 (deleteApp)
}
