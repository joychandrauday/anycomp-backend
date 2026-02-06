import { AppDataSource } from "../../config/database.config";
import { User, UserRole, UserStatus } from "../../entities/User.entity";
import { Repository } from "typeorm";

export class UserService {
    private userRepository: Repository<User>;

    constructor() {
        this.userRepository = AppDataSource.getRepository(User);
    }

    /** Get all users */
    async getAllUser(): Promise<User[]> {
        const users = await this.userRepository.find();
        if (!users) {
            throw new Error("Users not found.");
        }
        return users;
    }

    /** Get single user by ID */
    async getUserById(id: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new Error("User not found.");
        }
        return user;
    }

    /** Update user by ID */
    async updateUser(id: string, data: Partial<User>): Promise<User> {
        const user = await this.getUserById(id); // will throw error if not found
        Object.assign(user, data);
        return this.userRepository.save(user);
    }

    /** Delete user by ID */
    async deleteUser(id: string): Promise<void> {
        const user = await this.getUserById(id); // will throw error if not found
        await this.userRepository.remove(user);
    }
}
