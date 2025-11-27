export class WebhookLog {
    id?: string;
    createdAt: Date;
    request: any;

    constructor(request: any) {
        this.createdAt = new Date();
        this.request = request;
    }
}
