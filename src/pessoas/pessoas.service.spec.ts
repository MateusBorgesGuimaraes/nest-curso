import { Repository } from 'typeorm';
import { PessoasService } from './pessoas.service';
import { Pessoa } from './entities/pessoa.entity';
import { HashingService } from 'src/auth/hashing/hashing.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';

jest.mock('fs/promises');

describe('PessoasService', () => {
  let pessoasService: PessoasService;
  let pessoaRepository: Repository<Pessoa>;
  let hashingService: HashingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PessoasService,
        {
          provide: getRepositoryToken(Pessoa),
          useValue: {
            save: jest.fn(),
            create: jest.fn(),
            findOneBy: jest.fn(),
            find: jest.fn(),
            preload: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: HashingService,
          useValue: {
            hash: jest.fn(),
          },
        },
      ],
    }).compile();

    pessoasService = module.get<PessoasService>(PessoasService);
    pessoaRepository = module.get<Repository<Pessoa>>(
      getRepositoryToken(Pessoa),
    );
    hashingService = module.get<HashingService>(HashingService);
  });

  it('pessoaService deve estar definido', () => {
    expect(pessoasService).toBeDefined();
  });

  describe('create', () => {
    it('Deve criar uma nova pessoa', async () => {
      // Arrange
      // CreatePessoaDto
      const createPessoaDto: CreatePessoaDto = {
        email: 'mateus@gmail.com',
        nome: 'Mateus',
        password: '123456',
      };
      const passwordHash = 'HASHDESENHA';
      const novaPessoa = {
        id: 1,
        email: createPessoaDto.email,
        nome: createPessoaDto.nome,
        passwordHash,
      };

      // Como  o valor retornado po hashingService.hash() é necessario, vamos simular o valor
      jest.spyOn(hashingService, 'hash').mockResolvedValue(passwordHash);
      // Como o valor retornado po pessoaRepository.create() é necessario, vamos simular o valor
      jest.spyOn(pessoaRepository, 'create').mockReturnValue(novaPessoa as any);

      // Act -> Executar o metodo
      const result = await pessoasService.create(createPessoaDto);

      // Assert
      // O metodo hashingService.hash() foi chamado com o valor de createPessoaDto.password
      expect(hashingService.hash).toHaveBeenCalledWith(
        createPessoaDto.password,
      );

      // O metodo pessoaRepository.create() foi chamado com os dados de novaPessoa com o hash de senha gerado por hashingService.hash()
      expect(pessoaRepository.create).toHaveBeenCalledWith({
        email: createPessoaDto.email,
        nome: createPessoaDto.nome,
        passwordHash,
      });

      // O metodo pessoaRepository.save() foi chamado com os dados de novaPessoa gerada por pessoaRepository.create()
      expect(pessoaRepository.save).toHaveBeenCalledWith(novaPessoa);

      // O metodo pessoaService.create() retornou a novaPessoa
      expect(result).toEqual(novaPessoa);
    });
    it('deve lançar ConflictException se o email ja existir', async () => {
      jest.spyOn(pessoaRepository, 'save').mockRejectedValue({ code: '23505' });

      await expect(pessoasService.create({} as any)).rejects.toThrow(
        ConflictException,
      );
    });

    it('deve lançar Error generico quando ocorrer algum erro', async () => {
      jest
        .spyOn(pessoaRepository, 'save')
        .mockRejectedValue(new Error('Erro generico'));

      await expect(pessoasService.create({} as any)).rejects.toThrow(
        new Error('Erro generico'),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar uma pessoa se a pessoa existir', async () => {
      //
      const pessoaId = 1;
      const pessoaEncontrada = {
        id: pessoaId,
        email: 'mateus@gmail.com',
        nome: 'Mateus',
        passwordHash: '123456',
      };

      jest
        .spyOn(pessoaRepository, 'findOneBy')
        .mockResolvedValue(pessoaEncontrada as any);

      const result = await pessoasService.findOne(pessoaId);
      expect(result).toEqual(pessoaEncontrada);
    });

    it('deve lançar um erro se a pessoa nao existir', async () => {
      await expect(pessoasService.findOne(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar todas as pessoas', async () => {
      const pessoasMock: Pessoa[] = [
        {
          id: 1,
          email: 'mateus@gmail.com',
          nome: 'Mateus',
          passwordHash: '123456',
        } as Pessoa,
        {
          id: 2,
          email: 'maria@gmail.com',
          nome: 'Maria',
          passwordHash: '123456',
        } as Pessoa,
        {
          id: 3,
          email: 'carol@gmail.com',
          nome: 'Carol',
          passwordHash: '123456',
        } as Pessoa,
      ];
      jest.spyOn(pessoaRepository, 'find').mockResolvedValue(pessoasMock);

      const result = await pessoasService.findAll();
      expect(result).toEqual(pessoasMock);
      expect(pessoaRepository.find).toHaveBeenCalledWith({
        order: {
          id: 'desc',
        },
      });
    });
  });

  describe('update', () => {
    it('deve atualizar uma pessoa se for o usuario for autorizado', async () => {
      // Arrange
      const pessoaId = 1;
      const updatePessoaDto = {
        nome: 'Sol',
        password: '123456',
      };
      const tokenPayload = {
        sub: pessoaId,
      } as any;
      const passwordHash = 'HASHDESENHA';
      const pessoaAtualizada = {
        id: pessoaId,
        nome: 'Sol',
        passwordHash,
      };

      jest.spyOn(hashingService, 'hash').mockResolvedValue(passwordHash);
      jest
        .spyOn(pessoaRepository, 'preload')
        .mockResolvedValue(pessoaAtualizada as any);
      jest
        .spyOn(pessoaRepository, 'save')
        .mockResolvedValue(pessoaAtualizada as any);
      // Act

      const result = await pessoasService.update(
        pessoaId,
        updatePessoaDto,
        tokenPayload,
      );

      // Assert

      expect(hashingService.hash).toHaveBeenCalledWith(
        updatePessoaDto.password,
      );
      expect(pessoaRepository.preload).toHaveBeenCalledWith({
        id: pessoaId,
        nome: updatePessoaDto.nome,
        passwordHash,
      });
      expect(pessoaRepository.save).toHaveBeenCalledWith(pessoaAtualizada);
      expect(result).toEqual(pessoaAtualizada);
    });

    it('deve lançar ForbiddenException se o usuario não for autorizado', async () => {
      // Arrange
      const pessoaId = 1;
      const tokenPayload = {
        sub: 2,
      } as any;
      const updatePessoaDto = {
        nome: 'Sol',
      };
      const existingPessoa = {
        id: pessoaId,
        nome: 'Sol',
      };

      // Simula que a pessoas ja existe
      jest
        .spyOn(pessoaRepository, 'preload')
        .mockResolvedValue(existingPessoa as any);

      // Act e Assert
      await expect(
        pessoasService.update(pessoaId, updatePessoaDto, tokenPayload),
      ).rejects.toThrow(ForbiddenException);
    });

    it('deve lançar NotFoundException se o usuario existir', async () => {
      // Arrange
      const pessoaId = 1;
      const tokenPayload = {
        sub: pessoaId,
      } as any;
      const updatePessoaDto = {
        nome: 'Sol',
      };

      // simula que preload retornar null
      jest.spyOn(pessoaRepository, 'preload').mockResolvedValue(null as any);

      // Act e Assert
      await expect(
        pessoasService.update(pessoaId, updatePessoaDto, tokenPayload),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deve remover uma pessoa se autorizado', async () => {
      // Arrange
      const pessoaId = 1; // Pessoa com ID 1
      const tokenPayload = { sub: pessoaId } as any; // Usuário com ID 1
      const existingPessoa = { id: pessoaId, nome: 'John Doe' }; // Pessoa é o Usuário
      // findOne do service vai retornar a pessoa existente
      jest
        .spyOn(pessoasService, 'findOne')
        .mockResolvedValue(existingPessoa as any);
      // O método remove do repositório também vai retornar a pessoa existente
      jest
        .spyOn(pessoaRepository, 'remove')
        .mockResolvedValue(existingPessoa as any);
      // Act
      const result = await pessoasService.remove(pessoaId, tokenPayload);
      // Assert
      // Espero que findOne do pessoaService seja chamado com o ID da pessoa
      expect(pessoasService.findOne).toHaveBeenCalledWith(pessoaId);
      // Espero que o remove do repositório seja chamado com a pessoa existente
      expect(pessoaRepository.remove).toHaveBeenCalledWith(existingPessoa);
      // Espero que a pessoa apagada seja retornada
      expect(result).toEqual(existingPessoa);
    });
    it('deve lançar ForbiddenException se não autorizado', async () => {
      // Arrange
      const pessoaId = 1; // Pessoa com ID 1
      const tokenPayload = { sub: 2 } as any; // Usuário com ID 2
      const existingPessoa = { id: pessoaId, nome: 'John Doe' }; // Pessoa NÃO é o Usuário
      // Espero que o findOne seja chamado com pessoa existente
      jest
        .spyOn(pessoasService, 'findOne')
        .mockResolvedValue(existingPessoa as any);
      // Espero que o servico rejeite porque o usuário é diferente da pessoa
      await expect(
        pessoasService.remove(pessoaId, tokenPayload),
      ).rejects.toThrow(ForbiddenException);
    });
    it('deve lançar NotFoundException se a pessoa não for encontrada', async () => {
      const pessoaId = 1;
      const tokenPayload = { sub: pessoaId } as any;
      // Só precisamos que o findOne lance uma exception e o remove também deve lançar
      jest
        .spyOn(pessoasService, 'findOne')
        .mockRejectedValue(new NotFoundException());
      await expect(
        pessoasService.remove(pessoaId, tokenPayload),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('uploadPicture', () => {
    it('deve salvaar a imagem corretamente e salvar a pessoa', async () => {
      // Arrange
      const mockFile = {
        originalname: 'test.png',
        size: 2000,
        buffer: Buffer.from('file content'),
      } as Express.Multer.File;

      const mockPessoa = {
        id: 1,
        nome: 'Lua',
        email: 'lua@gmail.com',
      } as Pessoa;

      const tokenPayload = {
        sub: 1,
      } as any;

      jest.spyOn(pessoasService, 'findOne').mockResolvedValue(mockPessoa);
      jest.spyOn(pessoaRepository, 'save').mockResolvedValue({
        ...mockPessoa,
        picture: '1.png',
      });
      const filePath = path.resolve(process.cwd(), 'pictures', '1.png');

      // Act
      const result = await pessoasService.uploadPicture(mockFile, tokenPayload);

      // Assert
      expect(fs.writeFile).toHaveBeenCalledWith(filePath, mockFile.buffer);
      expect(pessoaRepository.save).toHaveBeenCalledWith({
        ...mockPessoa,
        picture: '1.png',
      });
      expect(result).toEqual({
        ...mockPessoa,
        picture: '1.png',
      });
    });

    it('deve lançar um BadRequestException se o arquivo for muito pequeno', async () => {
      // Arrange
      const mockFile = {
        originalname: 'test.png',
        size: 100,
        buffer: Buffer.from('small content'),
      } as Express.Multer.File;

      const tokenPayload = {
        sub: 1,
      } as any;

      // Act e Assert
      await expect(
        pessoasService.uploadPicture(mockFile, tokenPayload),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar NotFoundException se a pessoa não for encontrada', async () => {
      // Arrange
      const mockFile = {
        originalname: 'test.png',
        size: 2000,
        buffer: Buffer.from('file content'),
      } as Express.Multer.File;

      const tokenPayload = {
        sub: 1,
      } as any;

      jest
        .spyOn(pessoasService, 'findOne')
        .mockRejectedValue(new NotFoundException());

      // Act e Assert
      await expect(
        pessoasService.uploadPicture(mockFile, tokenPayload),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
