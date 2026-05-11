import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CompaniesManager from './CompaniesManager';

describe('CompaniesManager', () => {
  // Removido: campo de busca superior não existe mais

  it('renders filter inputs', () => {
    render(<CompaniesManager />);
    
    // Check if filter inputs are rendered
    expect(screen.getByPlaceholderText('Nome da empresa')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('00.000.000/0001-00')).toBeInTheDocument();
    expect(screen.getByText('Todos')).toBeInTheDocument();
  });

  it('renders companies table', () => {
    render(<CompaniesManager />);
    
    // Check if table headers are present
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('CNPJ')).toBeInTheDocument();
    expect(screen.getByText('SLA')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Data de Criação')).toBeInTheDocument();
    expect(screen.getByText('Ações')).toBeInTheDocument();
  });

  it('exibe seletor de itens por página e controles de navegação', () => {
    render(<CompaniesManager />);
    expect(screen.getByText('Itens por página')).toBeInTheDocument();
    expect(screen.getByText(/Página \d+ de \d+/)).toBeInTheDocument();
  });

  it('filters companies by search term', () => {
    render(<CompaniesManager />);
    
    const searchInput = screen.getByPlaceholderText('Buscar por nome ou CNPJ...');
    fireEvent.change(searchInput, { target: { value: 'Tech Corp' } });
    
    // Should show filtered results
    expect(screen.getByText('Tech Corp Brasil Ltda')).toBeInTheDocument();
  });

  it('shows clear filters button', () => {
    render(<CompaniesManager />);
    
    const clearButton = screen.getByText('Limpar filtros');
    expect(clearButton).toBeInTheDocument();
  });

  it('renders new company button', () => {
    render(<CompaniesManager />);
    
    const newButton = screen.getByText('Nova Empresa');
    expect(newButton).toBeInTheDocument();
  });

  it('abre modal ao clicar em Editar', () => {
    render(<CompaniesManager />);

    const editButtons = screen.getAllByRole('button');
    const editBtn = editButtons.find(b => b.querySelector('svg')) as HTMLButtonElement;
    fireEvent.click(editBtn);

    expect(screen.getByText('Editar Empresa')).toBeInTheDocument();
    expect(screen.getByText('Salvar')).toBeInTheDocument();
  });

  it('abre modal Nova Empresa ao clicar no botão', () => {
    render(<CompaniesManager />);
    const btn = screen.getByText('Nova Empresa');
    fireEvent.click(btn);
    expect(screen.getByText('Nova Empresa')).toBeInTheDocument();
    expect(screen.getByText('Salvar')).toBeInTheDocument();
  });

  it('renderiza botão de Bloquear empresa', () => {
    render(<CompaniesManager />);
    const blockBtn = screen.getByLabelText('Bloquear empresa');
    expect(blockBtn).toBeInTheDocument();
  });

  it('mostra botão Ativar quando status é Inativo', () => {
    render(<CompaniesManager />);
    const activateBtn = screen.getByLabelText('Ativar empresa');
    expect(activateBtn).toBeInTheDocument();
  });
});
