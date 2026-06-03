# -*- mode: ruby -*-
# vi: set ft=ruby :

# ══════════════════════════════════════════════════════════════════
# Vagrantfile — Internet Sehat: Sistem Pengayaan Edukasi Sehat
# ══════════════════════════════════════════════════════════════════
# Mendefinisikan 3 VM dalam satu private network:
#   cc-db       192.168.56.10   PostgreSQL 16
#   cc-be       192.168.56.11   Flask + Gunicorn + Nginx
#   cc-fe       192.168.56.12   Next.js
#
# Provisioning menggunakan Ansible (ansible_local).
#
# Penggunaan:
#   vagrant up              → Buat dan jalankan semua VM
#   vagrant up db           → Jalankan hanya VM Database
#   vagrant ssh db          → SSH ke VM Database
#   vagrant halt            → Matikan semua VM
#   vagrant destroy -f      → Hapus semua VM
# ══════════════════════════════════════════════════════════════════

Vagrant.configure("2") do |config|

  # Base box: Ubuntu 22.04 LTS
  config.vm.box = "ubuntu/jammy64"

  # ─── VM Database ─────────────────────────────────────────────
  config.vm.define "db" do |db|
    db.vm.hostname = "cc-db"
    db.vm.network "private_network", ip: "192.168.56.10"

    db.vm.provider "virtualbox" do |vb|
      vb.name   = "cc-db"
      vb.memory = 2048
      vb.cpus   = 1
    end

    db.vm.synced_folder "./database", "/home/vagrant/app/database"
    db.vm.synced_folder "./ansible",  "/home/vagrant/ansible"

    db.vm.provision "ansible_local" do |ansible|
      ansible.playbook       = "playbook.yml"
      ansible.provisioning_path = "/home/vagrant/ansible"
      ansible.extra_vars     = { role: "db" }
    end
  end

  # ─── VM Backend ──────────────────────────────────────────────
  config.vm.define "backend" do |be|
    be.vm.hostname = "cc-be"
    be.vm.network "private_network", ip: "192.168.56.11"

    be.vm.provider "virtualbox" do |vb|
      vb.name   = "cc-be"
      vb.memory = 2048
      vb.cpus   = 1
    end

    be.vm.synced_folder "./backend", "/home/vagrant/app/backend"
    be.vm.synced_folder "./ansible", "/home/vagrant/ansible"

    be.vm.provision "ansible_local" do |ansible|
      ansible.playbook       = "playbook.yml"
      ansible.provisioning_path = "/home/vagrant/ansible"
      ansible.extra_vars     = { role: "backend" }
    end
  end

  # ─── VM Frontend ─────────────────────────────────────────────
  config.vm.define "frontend" do |fe|
    fe.vm.hostname = "cc-fe"
    fe.vm.network "private_network", ip: "192.168.56.12"

    fe.vm.provider "virtualbox" do |vb|
      vb.name   = "cc-fe"
      vb.memory = 2048
      vb.cpus   = 1
    end

    fe.vm.synced_folder "./frontend", "/home/vagrant/app/frontend"
    fe.vm.synced_folder "./ansible",  "/home/vagrant/ansible"

    fe.vm.provision "ansible_local" do |ansible|
      ansible.playbook       = "playbook.yml"
      ansible.provisioning_path = "/home/vagrant/ansible"
      ansible.extra_vars     = { role: "frontend" }
    end
  end

end
