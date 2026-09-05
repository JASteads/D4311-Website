export class Account {
    readonly username: string | undefined;
    readonly alias: string | undefined;
    readonly email: string | undefined;
    readonly type: string | undefined;

    constructor(username?: string, alias?: string, email?: string, type?: string) {
        this.username = username;
        this.alias = alias;
        this.email = email;
        this.type = type;
    }

    isEmpty = () => !(this.username || this.alias || this.email || this.type);
}