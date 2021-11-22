import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import User from '../entities/user.entity';
import { Logger } from '@nestjs/common';

export default class UsersSeeder implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<void> {
    Logger.log('Seed starting....', 'Seeder');
    await factory(User)().createMany(1);
    Logger.log('Seed end....', 'Seeder');
  }
}
