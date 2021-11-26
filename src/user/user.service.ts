import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Any, Like, Not, Repository } from 'typeorm';
import User from './entities/user.entity';
import { PublicFilesService } from '../publicFiles/publicFiles.service';
import { plainToClass } from 'class-transformer';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly filesService: PublicFilesService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const newUser = await this.usersRepository.create(createUserDto);
    await this.usersRepository.save(newUser);
    return newUser;
  }

  async findAll(query, user) {
    const take: number = query.take || 10;
    const skip: number = query.skip || 0;
    const keyWord: string = query.keyWord || '';
    const isOnline: boolean = query.isOnline;
    const [result, total] = await this.usersRepository.findAndCount({
      where: {
        id: Not(user.id),
        name: Like(`%${keyWord}%`),
        is_online: isOnline || Any([false, true]),
      },
      take,
      skip,
      order: {
        id: 'ASC',
      },
    });

    return { users: result, count: total };
  }

  async findOne(id: number) {
    const user = await this.usersRepository.findOne({ id });
    if (user) {
      return user;
    }
    throw new HttpException(
      `Use with id ${id} not found`,
      HttpStatus.NOT_FOUND,
    );
  }

  async getByEmail(email: string): Promise<User> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password')
      .getOne();
    if (user) {
      return user;
    }
    throw new HttpException(
      `Use with email ${email} not found`,
      HttpStatus.NOT_FOUND,
    );
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findOne({ id });
    Logger.log(`User updated`, 'Update');
    await this.usersRepository.save({
      ...user,
      ...updateUserDto,
    });

    return await this.usersRepository.findOne({ id });
  }

  async remove(id: number) {
    const deleteResponse = await this.usersRepository.delete(id);
    if (!deleteResponse.affected) {
      throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
    }
  }

  async setOnlineStatus(user: User, status = true): Promise<User> {
    return await this.usersRepository.save({ ...user, is_online: status });
  }

  async setOfflineStatus(user: User): Promise<User> {
    return await this.setOnlineStatus(user, false);
  }

  async addAvatar(userId: number, imageBuffer: Buffer, filename: string) {
    const user = await this.findOne(userId);
    if (user.avatar) {
      await this.deleteAvatar(user.id);
    }
    const avatar = await this.filesService.uploadPublicFile(
      imageBuffer,
      filename,
    );
    await this.usersRepository.update(userId, {
      ...user,
      avatar,
    });
    return avatar.url;
  }

  async deleteAvatar(userId: number) {
    const user = await this.usersRepository.findOne(userId);
    const fieldId = user.avatar?.id;
    if (fieldId) {
      await this.usersRepository.update(userId, {
        ...user,
        avatar: null,
      });
    }
    await this.filesService.deletePublicFile(fieldId);
  }
}
