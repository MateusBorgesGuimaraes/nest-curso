import { Repository } from 'typeorm';
import { PessoasService } from './pessoas.service';
import { Pessoa } from './entities/pessoa.entity';
import { HashingService } from 'src/auth/hashing/hashing.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreatePessoaDto } from './dto/create-pessoa.dto';
import { hash } from 'crypto';
import { create } from 'domain';

describe('PessoasService', () => {
  let pessoaService: PessoasService;
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

    pessoaService = module.get<PessoasService>(PessoasService);
    pessoaRepository = module.get<Repository<Pessoa>>(
      getRepositoryToken(Pessoa),
    );
    hashingService = module.get<HashingService>(HashingService);
  });

  it('pessoaService deve estar definido', () => {
    expect(pessoaService).toBeDefined();
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

      // Preciso que o HashingService tenha o hash
      // Saber se o hash service foi chamado com CreatePessoaDto.password
      // Saber se o PessoaRepository.create foi chamado com dadosPessoa
      // Saber se o PessoaRepository.save foi chamado com a pessoa criada
      // O retorno final deve ser a pessoa criada

      jest.spyOn(hashingService, 'hash').mockResolvedValue('HASHDESENHA');

      // Act
      await pessoaService.create(createPessoaDto);

      // Assert
      expect(hashingService.hash).toHaveBeenCalledWith(
        createPessoaDto.password,
      );

      expect(pessoaRepository.create).toHaveBeenCalledWith({
        email: createPessoaDto.email,
        nome: createPessoaDto.nome,
        passwordHash: 'HASHDESENHA',
      });
    });
  });
});
